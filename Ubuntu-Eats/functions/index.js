const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({
  origin: true, // Allow all origins during development
  credentials: true,
});

admin.initializeApp();

// Helper function to wrap functions with CORS
const corsWrapper = (handler) => {
  return (req, res) => {
    return cors(req, res, () => {
      return handler(req, res);
    });
  };
};

// Helper function to verify Firebase auth token
const verifyAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
};



exports.getUserData = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST.'
      });
    }

    const { userId, userEmail } = req.body;

    if (!userId && !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'userId or userEmail is required'
      });
    }

    let userDoc;
    
    if (userEmail) {
      userDoc = await admin.firestore().collection('users').doc(userEmail).get();
    } else if (userId) {
      // Search by userId field in users collection
      const querySnapshot = await admin.firestore()
        .collection('users')
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
      }
    }

    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    return res.status(200).json({
      success: true,
      user: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        registrationNumber: userData.registrationNumber,
        contactPerson: userData.contactPerson
      }
    });

  } catch (error) {
    console.error("Error getting user data:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to get user data: ${error.message}`
    });
  }
}));

// Create a donation listing in foodListings collection
exports.createDonationListing = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST.'
      });
    }

    // Verify user authentication
    const user = await verifyAuth(req);
    console.log('Creating donation listing for user:', user.uid);

    const {
      foodType,
      category,
      quantity,
      unit,
      description,
      expiryDate,
      pickupDate,
      pickupTime,
      contactPerson,
      contactPhone,
      pickupAddress,
      specialInstructions,
      donorData,
      forFarmers = false,
      coordinates = null
    } = req.body;

    console.log('Data received:', req.body);

    // Validate required fields
    if (!foodType || !category || !quantity || !pickupDate || !pickupTime || !pickupAddress) {
      console.log('Missing required fields:', { foodType, category, quantity, pickupDate, pickupTime, pickupAddress });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: foodType, category, quantity, pickupDate, pickupTime, pickupAddress'
      });
    }

    // Generate unique listing ID
    const listingID = admin.firestore().collection('foodListings').doc().id;
    
    // Create the listing document
    const listingData = {
      // Required fields matching your Firebase structure
      address: pickupAddress,
      collectBy: admin.firestore.Timestamp.fromDate(new Date(`${pickupDate} ${pickupTime}`)),
      coordinates: coordinates || null, // [lat, lng] or null
      dateListed: admin.firestore.Timestamp.now(),
      forFarmers: Boolean(forFarmers), // Ensure boolean value
      listingCompany: donorData?.name || donorData?.companyName || "Unknown",
      listingDescription: description || `${foodType} - ${quantity} ${unit}. ${specialInstructions || ''}`.trim(),
      listingID: listingID,
      listingStatus: "UNCLAIMED",
      location: pickupAddress.split(',')[0] || pickupAddress, // Extract city/area from full address
      typeOfFood: category || foodType,
      
      // Additional fields for better functionality
      foodType: foodType,
      quantity: quantity,
      unit: unit,
      expiryDate: expiryDate || null,
      contactPerson: contactPerson,
      contactPhone: contactPhone,
      specialInstructions: specialInstructions || "",
      
      // Donor information
      donorId: user.uid,
      donorEmail: user.email,
      
      // Timestamps
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    console.log('Saving listing data:', listingData);

    // Save to foodListings collection
    await admin.firestore()
      .collection('foodListings')
      .doc(listingID)
      .set(listingData);

    console.log(`Created donation listing: ${listingID} for user: ${user.uid}`);

    return res.status(200).json({
      success: true,
      listingID: listingID,
      message: "Donation listing created successfully",
      data: listingData
    });

  } catch (error) {
    console.error("Error creating donation listing:", error);
    
    if (error.message.includes('authorization') || error.message.includes('authentication')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Failed to create donation listing: ${error.message}`
    });
  }
}));

// Geocode address function (simplified for now)

exports.geocodeAddress = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST.'
      });
    }

    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    console.log(`Geocoding request for: ${address}`);
    
    try {
      const googleMapsApiKey = "AIzaSyDGsQG8-0j79bK3_fzM_gCyt90IpIOvmd8";
      
      const fetch = (await import('node-fetch')).default;
      const encodedAddress = encodeURIComponent(`${address}, South Africa`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=ZA&key=${googleMapsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        
        return res.status(200).json({
          success: true,
          coordinates: { lat, lng },
          address: result.formatted_address,
          message: "Address geocoded successfully"
        });
      } else {
        console.log('Geocoding failed:', data.status, data.error_message);
        return res.status(400).json({
          success: false,
          coordinates: null,
          address: address,
          message: `Geocoding failed: ${data.status}`
        });
      }
      
    } catch (error) {
      console.error('Geocoding API error:', error);
      return res.status(500).json({
        success: false,
        coordinates: null,
        address: address,
        message: "Geocoding service temporarily unavailable"
      });
    }

  } catch (error) {
    console.error("Error geocoding address:", error);
    
    return res.status(500).json({
      success: false,
      message: `Failed to geocode address: ${error.message}`
    });
  }
}));

// Upload donation image function
exports.uploadDonationImage = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST.'
      });
    }

    // Verify user authentication
    const user = await verifyAuth(req);

    const { listingID, imageData, fileName, contentType = 'image/jpeg' } = req.body;

    if (!listingID || !imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required image upload data: listingID, imageData, fileName'
      });
    }

    console.log(`Uploading image for listing: ${listingID}, file: ${fileName}`);

    // Verify the listing exists and belongs to the user
    const listingRef = admin.firestore().collection('foodListings').doc(listingID);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const listingData = listingDoc.data();
    if (listingData.donorId !== user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your listing'
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Validate image size (5MB limit)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image too large (max 5MB)'
      });
    }
    
    // Create storage reference with same listingID
    const bucket = admin.storage().bucket();
    const imagePath = `donations/${listingID}/${fileName}`;
    const file = bucket.file(imagePath);

    // Upload image with metadata
    await file.save(imageBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          listingID: listingID,
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;

    // Update listing with image URL (for single image)
    // If you want multiple images, you'd need to modify this to append to an array
    await listingRef.update({
      imageURL: publicUrl,
      imagePath: imagePath,
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`Successfully uploaded image for listing: ${listingID}`);

    return res.status(200).json({
      success: true,
      imageURL: publicUrl,
      imagePath: imagePath,
      message: "Image uploaded successfully"
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    
    if (error.message.includes('authorization') || error.message.includes('authentication')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Failed to upload image: ${error.message}`
    });
  }
}));

// Update donation listing status
exports.updateDonationStatus = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST.'
      });
    }

    // Verify user authentication
    const user = await verifyAuth(req);

    const { listingID, status } = req.body;

    if (!listingID || !status) {
      return res.status(400).json({
        success: false,
        message: 'ListingID and status are required'
      });
    }

    // Valid statuses with better organization
    const validStatuses = {
      'UNCLAIMED': { displayName: 'Pending Pickup', allowedFrom: [] },
      'PENDING_PICKUP': { displayName: 'Pending Pickup', allowedFrom: ['UNCLAIMED'] },
      'IN_TRANSIT': { displayName: 'In Transit', allowedFrom: ['UNCLAIMED', 'PENDING_PICKUP'] },
      'COMPLETED': { displayName: 'Completed', allowedFrom: ['IN_TRANSIT'] },
      'CANCELLED': { displayName: 'Cancelled', allowedFrom: ['UNCLAIMED', 'PENDING_PICKUP'] }
    };

    if (!validStatuses[status]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + Object.keys(validStatuses).join(', ')
      });
    }

    const listingRef = admin.firestore().collection('foodListings').doc(listingID);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const listingData = listingDoc.data();
    
    // Verify the listing belongs to the authenticated user
    if (listingData.donorId !== user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your listing'
      });
    }

    // Check if the status transition is valid
    const currentStatus = listingData.listingStatus;
    const newStatusConfig = validStatuses[status];
    
    // Allow any status change if coming from the same status (refresh case) or if no restrictions
    const canChangeStatus = currentStatus === status || 
                           newStatusConfig.allowedFrom.length === 0 || 
                           newStatusConfig.allowedFrom.includes(currentStatus);

    if (!canChangeStatus) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}. Allowed transitions: ${newStatusConfig.allowedFrom.join(', ')} → ${status}`
      });
    }

    // Update the listing with new status and timestamp
    const updateData = {
      listingStatus: status,
      updatedAt: admin.firestore.Timestamp.now()
    };

    // Add specific timestamps for certain status changes
    if (status === 'IN_TRANSIT') {
      updateData.pickedUpAt = admin.firestore.Timestamp.now();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = admin.firestore.Timestamp.now();
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = admin.firestore.Timestamp.now();
    }

    await listingRef.update(updateData);

    console.log(`Updated listing ${listingID} status from ${currentStatus} to ${status} by user ${user.uid}`);

    // Return updated listing data
    const updatedDoc = await listingRef.get();
    const updatedData = updatedDoc.data();

    return res.status(200).json({
      success: true,
      listingID: listingID,
      previousStatus: currentStatus,
      newStatus: status,
      displayName: newStatusConfig.displayName,
      updatedAt: updatedData.updatedAt?.toDate()?.toISOString(),
      message: "Status updated successfully",
      data: {
        ...updatedData,
        // Convert timestamps to ISO strings for easier frontend handling
        dateListed: updatedData.dateListed?.toDate()?.toISOString(),
        collectBy: updatedData.collectBy?.toDate()?.toISOString(),
        createdAt: updatedData.createdAt?.toDate()?.toISOString(),
        updatedAt: updatedData.updatedAt?.toDate()?.toISOString(),
        pickedUpAt: updatedData.pickedUpAt?.toDate()?.toISOString(),
        completedAt: updatedData.completedAt?.toDate()?.toISOString(),
        cancelledAt: updatedData.cancelledAt?.toDate()?.toISOString()
      }
    });

  } catch (error) {
    console.error("Error updating donation status:", error);
    
    if (error.message.includes('authorization') || error.message.includes('authentication')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Failed to update donation status: ${error.message}`
    });
  }
}));


exports.getDonorDonations = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    // Only allow GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use GET or POST.'
      });
    }

    // Verify user authentication
    const user = await verifyAuth(req);
    console.log('Getting donations for user:', user.uid);

    const {
      status,
      limit = 50
    } = req.method === 'GET' ? req.query : req.body;

    // Build query for user's donations - simplified to avoid index requirements
    let query = admin.firestore()
      .collection('foodListings')
      .where('donorId', '==', user.uid);

    // Filter by status if specified
    if (status && status !== 'all') {
      query = query.where('listingStatus', '==', status);
    }

    // Apply limit
    const queryLimit = Math.min(parseInt(limit) || 50, 100);
    query = query.limit(queryLimit);

    // Execute query
    const querySnapshot = await query.get();

    // Process results and sort in memory
    const donations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const donation = {
        id: doc.id,
        ...data,
        dateListed: data.dateListed?.toDate()?.toISOString() || null,
        collectBy: data.collectBy?.toDate()?.toISOString() || null,
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
        pickedUpAt: data.pickedUpAt?.toDate()?.toISOString() || null,
        completedAt: data.completedAt?.toDate()?.toISOString() || null,
        cancelledAt: data.cancelledAt?.toDate()?.toISOString() || null
      };

      donations.push(donation);
    });

    // Sort by dateListed in memory (newest first)
    donations.sort((a, b) => {
      const dateA = new Date(a.dateListed || 0);
      const dateB = new Date(b.dateListed || 0);
      return dateB - dateA;
    });

    console.log(`Found ${donations.length} donations for user ${user.uid}`);

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations: donations,
      filters: {
        status: status || 'all',
        limit: queryLimit
      }
    });

  } catch (error) {
    console.error("Error getting user donations:", error);
    
    if (error.message.includes('authorization') || error.message.includes('authentication')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Failed to get user donations: ${error.message}`
    });
  }
}));


// Create or get chat room between donor and NGO
exports.createChatRoom = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const user = await verifyAuth(req);
    const { donorEmail, ngoEmail, donationId } = req.body;

    if (!donorEmail || !ngoEmail || !donationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'donorEmail, ngoEmail, and donationId are required' 
      });
    }

    // Create unique chat room ID
    const chatRoomId = `${donorEmail.replace('@', '_')}_${ngoEmail.replace('@', '_')}_${donationId}`;
    
    const chatRoomRef = admin.firestore().collection('chatRooms').doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      // Create new chat room
      await chatRoomRef.set({
        id: chatRoomId,
        donorEmail,
        ngoEmail,
        donationId,
        participants: [donorEmail, ngoEmail],
        createdAt: admin.firestore.Timestamp.now(),
        lastMessage: null,
        lastMessageTime: null
      });
    }

    return res.status(200).json({
      success: true,
      chatRoomId
    });

  } catch (error) {
    console.error("Error creating chat room:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to create chat room: ${error.message}`
    });
  }
}));

// Send message to chat room
exports.sendMessage = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const user = await verifyAuth(req);
    const { chatRoomId, message, senderName, senderRole } = req.body;

    if (!chatRoomId || !message || !senderName) {
      return res.status(400).json({ 
        success: false, 
        message: 'chatRoomId, message, and senderName are required' 
      });
    }

    // Verify user is participant in chat room
    const chatRoomRef = admin.firestore().collection('chatRooms').doc(chatRoomId);
    const chatRoomDoc = await chatRoomRef.get();

    if (!chatRoomDoc.exists) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    const chatRoomData = chatRoomDoc.data();
    if (!chatRoomData.participants.includes(user.email)) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this chat' });
    }

    // Add message to subcollection
    const messagesRef = admin.firestore()
      .collection('chatRooms')
      .doc(chatRoomId)
      .collection('messages');

    await messagesRef.add({
      text: message,
      senderEmail: user.email,
      senderName,
      senderRole: senderRole || 'user',
      timestamp: admin.firestore.Timestamp.now(),
      read: false
    });

    // Update chat room with last message info
    await chatRoomRef.update({
      lastMessage: message,
      lastMessageTime: admin.firestore.Timestamp.now()
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to send message: ${error.message}`
    });
  }
}));

// Get user's chat rooms
exports.getUserChatRooms = functions.https.onRequest(corsWrapper(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const user = await verifyAuth(req);
    
    const chatRoomsRef = admin.firestore().collection('chatRooms');
    const snapshot = await chatRoomsRef
      .where('participants', 'array-contains', user.email)
      .orderBy('lastMessageTime', 'desc')
      .get();

    const chatRooms = [];
    snapshot.forEach(doc => {
      chatRooms.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json({
      success: true,
      chatRooms
    });

  } catch (error) {
    console.error("Error getting chat rooms:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to get chat rooms: ${error.message}`
    });
  }
}));

