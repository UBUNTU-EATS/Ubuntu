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

// Create a donation listing in foodListings collection
exports.createDonationListing = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

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
      forFarmers = false, // Default to false if not provided
      coordinates = null
    } = data;

    // Validate required fields
    if (!foodType || !category || !quantity || !pickupDate || !pickupTime || !pickupAddress) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
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
      donorId: context.auth.uid,
      donorEmail: context.auth.token.email,
      
      // Timestamps
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    // Save to foodListings collection
    await admin.firestore()
      .collection('foodListings')
      .doc(listingID)
      .set(listingData);

    console.log(`Created donation listing: ${listingID} for user: ${context.auth.uid}`);

    return {
      success: true,
      listingID: listingID,
      message: "Donation listing created successfully",
      data: listingData
    };

  } catch (error) {
    console.error("Error creating donation listing:", error);
    
    // Return more specific error messages
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to create donation listing: ${error.message}`);
  }
});

// Upload image for donation listing
exports.uploadDonationImage = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { listingID, imageData, fileName, contentType = 'image/jpeg' } = data;

    if (!listingID || !imageData || !fileName) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required image upload data');
    }

    // Verify the listing exists and belongs to the user
    const listingRef = admin.firestore().collection('foodListings').doc(listingID);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Listing not found');
    }

    const listingData = listingDoc.data();
    if (listingData.donorId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied - not your listing');
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Validate image size (5MB limit)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new functions.https.HttpsError('invalid-argument', 'Image too large (max 5MB)');
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
          uploadedBy: context.auth.uid,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;

    // Update listing with image URL
    await listingRef.update({
      imageURL: publicUrl,
      imagePath: imagePath,
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`Uploaded image for listing: ${listingID}`);

    return {
      success: true,
      imageURL: publicUrl,
      imagePath: imagePath,
      message: "Image uploaded successfully"
    };

  } catch (error) {
    console.error("Error uploading image:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to upload image: ${error.message}`);
  }
});

// Update donation listing status
exports.updateDonationStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { listingID, status, claimedBy = null } = data;

    if (!listingID || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const validStatuses = ['UNCLAIMED', 'CLAIMED', 'PICKED_UP', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid status value');
    }

    const updateData = {
      listingStatus: status,
      updatedAt: admin.firestore.Timestamp.now()
    };

    if (claimedBy) {
      updateData.claimedBy = claimedBy;
      updateData.claimedAt = admin.firestore.Timestamp.now();
    }

    await admin.firestore()
      .collection('foodListings')
      .doc(listingID)
      .update(updateData);

    console.log(`Updated listing ${listingID} status to: ${status}`);

    return {
      success: true,
      message: `Listing status updated to ${status}`,
      updatedFields: updateData
    };

  } catch (error) {
    console.error("Error updating donation status:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to update donation status: ${error.message}`);
  }
});

// Get coordinates from address (using a geocoding service)
exports.geocodeAddress = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { address } = data;
    
    if (!address) {
      throw new functions.https.HttpsError('invalid-argument', 'Address is required');
    }
    
    // This is a placeholder - you'll need to integrate with a geocoding service
    // like Google Geocoding API, Mapbox, or similar
    
    // For now, return sample coordinates for Johannesburg area based on address
    let coordinates = [-26.2041, 28.0473]; // Default Johannesburg coordinates
    
    // Simple address-based coordinate mapping for South African cities
    const addressLower = address.toLowerCase();
    if (addressLower.includes('cape town') || addressLower.includes('capetown')) {
      coordinates = [-33.9249, 18.4241];
    } else if (addressLower.includes('durban')) {
      coordinates = [-29.8587, 31.0218];
    } else if (addressLower.includes('pretoria')) {
      coordinates = [-25.7479, 28.2293];
    } else if (addressLower.includes('port elizabeth') || addressLower.includes('gqeberha')) {
      coordinates = [-33.9608, 25.6022];
    } else if (addressLower.includes('bloemfontein')) {
      coordinates = [-29.0852, 26.1596];
    }
    
    console.log(`Geocoded address "${address}" to coordinates:`, coordinates);
    
    return {
      success: true,
      coordinates: coordinates,
      address: address,
      message: "Coordinates retrieved successfully"
    };

  } catch (error) {
    console.error("Error geocoding address:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to geocode address: ${error.message}`);
  }
});

// Development/Testing endpoint to list all donations
exports.getDonations = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { limit = 10, status = null } = data;

    let query = admin.firestore()
      .collection('foodListings')
      .orderBy('dateListed', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('listingStatus', '==', status);
    }

    const snapshot = await query.get();
    const donations = [];

    snapshot.forEach(doc => {
      donations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      donations: donations,
      count: donations.length
    };

  } catch (error) {
    console.error("Error fetching donations:", error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch donations');
  }
});