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
    // Only allow POST requests
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
    
    // For now, return null coordinates
    // You can implement actual geocoding using Google Maps API later
    return res.status(200).json({
      success: true,
      coordinates: null, // [lat, lng] - implement actual geocoding service here
      address: address,
      message: "Geocoding completed (coordinates will be null for now)"
    });

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

    // Valid statuses
    const validStatuses = ['UNCLAIMED', 'PENDING_PICKUP', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
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
    if (listingData.donorId !== user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your listing'
      });
    }

    await listingRef.update({
      listingStatus: status,
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`Updated listing ${listingID} status to: ${status}`);

    return res.status(200).json({
      success: true,
      listingID: listingID,
      newStatus: status,
      message: "Status updated successfully"
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