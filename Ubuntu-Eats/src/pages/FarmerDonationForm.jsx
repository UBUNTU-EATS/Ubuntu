// Enhanced FarmerDonationForm.jsx with Image Upload Support
import React, { useState } from "react";
import { auth } from "../../firebaseConfig";
import { FaHeart, FaSeedling, FaTractor, FaLeaf, FaClock, FaCamera } from "react-icons/fa";
import "../styles/FarmerDashboard.css";

const FarmerDonationForm = ({ onSubmit, farmerData }) => {
  const [formData, setFormData] = useState({
    foodType: '',
    category: '',
    quantity: '',
    unit: 'kg',
    description: '',
    expiryDate: '',
    pickupDate: '',
    pickupTime: '09:00',
    contactPerson: farmerData?.name || farmerData?.farmName || '',
    contactPhone: farmerData?.phone || '',
    pickupAddress: farmerData?.address || '',
    specialInstructions: '',
    condition: 'excellent',
    organicCertified: farmerData?.organicCertified === 'yes',
    storageConditions: 'room-temperature',
    forFarmers: false, // Allow other farmers to claim this
  });

  // Image upload states (matching donor form)
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Make authenticated request to backend
  const makeAuthenticatedRequest = async (endpoint, body) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();
    const functionUrl = `https://us-central1-ubuntu-eats.cloudfunctions.net/${endpoint}`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }
    return await response.json();
  };

  // Convert image to base64 (matching donor form)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      reader.onerror = error => reject(error);
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Image upload functions (copied from donor form)
  const processFiles = (files) => {
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setSubmitStatus({
          type: 'error',
          message: `${file.name} is not a valid image format. Please use JPG or PNG.`
        });
        return;
      }
      
      if (file.size > maxSize) {
        setSubmitStatus({
          type: 'error',
          message: `${file.name} is too large. Maximum size is 5MB.`
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            url: e.target.result,
            name: file.name,
            file: file // Store the actual file for upload
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please log in to create a donation");

      // Validate required fields
      if (!formData.foodType || !formData.category || !formData.quantity || 
          !formData.pickupDate || !formData.pickupAddress) {
        throw new Error('Please fill in all required fields');
      }

      // Validate pickup date
      const pickupDateTime = new Date(`${formData.pickupDate} ${formData.pickupTime}`);
      if (pickupDateTime <= new Date()) {
        throw new Error('Pickup date and time must be in the future');
      }

      // Prepare data for backend (matching the expected format)
      const donationData = {
        // Food details
        foodType: formData.foodType,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        description: formData.description,
        
        // Dates
        expiryDate: formData.expiryDate || null,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        
        // Contact & Location
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        pickupAddress: formData.pickupAddress,
        specialInstructions: formData.specialInstructions,
        
        // Farmer-specific fields
        condition: formData.condition,
        organicCertified: formData.organicCertified,
        storageConditions: formData.storageConditions,
        
        // System fields
        forFarmers: formData.forFarmers,
        donorType: 'farmer', // Identify this as a farmer donation
      };

      console.log('Submitting farmer donation:', donationData);

      // Create the donation listing first
      const listingResult = await makeAuthenticatedRequest("createDonationListing", donationData);

      if (!listingResult.success) {
        throw new Error(listingResult.message || 'Failed to create donation listing');
      }

      const listingID = listingResult.listingID;

      // Upload images if any (matching donor form pattern)
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          try {
            const base64Data = await convertToBase64(image.file);
            await makeAuthenticatedRequest('uploadDonationImage', {
              listingID,
              imageData: base64Data,
              fileName: `farmer_image_${i + 1}_${image.name}`,
              contentType: image.file.type
            });
          } catch (uploadError) {
            console.error(`Error uploading ${image.name}:`, uploadError);
            // Continue with other images even if one fails
          }
        }
      }

      // Success!
      setSubmitStatus({
        type: 'success',
        message: '🎉 Your farm donation has been listed successfully! NGOs and other farmers can now claim it.'
      });

      // Call the parent callback if provided
      if (onSubmit) {
        onSubmit({
          ...donationData,
          listingID: listingID,
          submittedAt: new Date().toISOString(),
        });
      }

      // Reset form after successful submission
      setFormData({
        foodType: '',
        category: '',
        quantity: '',
        unit: 'kg',
        description: '',
        expiryDate: '',
        pickupDate: '',
        pickupTime: '09:00',
        contactPerson: farmerData?.name || farmerData?.farmName || '',
        contactPhone: farmerData?.phone || '',
        pickupAddress: farmerData?.address || '',
        specialInstructions: '',
        condition: 'excellent',
        organicCertified: farmerData?.organicCertified === 'yes',
        storageConditions: 'room-temperature',
        forFarmers: false,
      });
      setImages([]); // Reset images

    } catch (error) {
      console.error("Error submitting farmer donation:", error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit donation. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="donation-form-container">
      <div className="donation-header">
        <div className="header-icon">
          <FaSeedling />
        </div>
        <div>
          <h2>Donate Farm Surplus</h2>
          <p>Share your excess produce with communities and NGOs in need</p>
        </div>
      </div>

      {/* Status Messages */}
      {submitStatus.message && (
        <div className={`status-message ${submitStatus.type}`} style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '12px',
          backgroundColor: submitStatus.type === 'success' ? '#d4edda' : '#f8d7da',
          color: submitStatus.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${submitStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          fontSize: '0.95rem',
        }}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="donation-form">
        {/* Product Details Section */}
        <div className="form-section">
          <h3><FaSeedling /> Product Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="foodType">Product Name *</label>
              <input
                type="text"
                id="foodType"
                name="foodType"
                value={formData.foodType}
                onChange={handleInputChange}
                placeholder="e.g., Fresh Tomatoes, Sweet Corn, Free-range Eggs"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                <option value="vegetables">🥕 Fresh Vegetables</option>
                <option value="fruits">🍎 Fresh Fruits</option>
                <option value="herbs">🌿 Herbs & Spices</option>
                <option value="grains">🌾 Grains & Legumes</option>
                <option value="dairy">🥛 Dairy Products</option>
                <option value="eggs">🥚 Eggs</option>
                <option value="meat">🥩 Meat & Poultry</option>
                <option value="processed">📦 Processed Foods</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="quantity">Quantity *</label>
              <div className="quantity-input">
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  step="0.1"
                  required
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="unit-select"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="pieces">pieces</option>
                  <option value="boxes">boxes</option>
                  <option value="bags">bags</option>
                  <option value="liters">liters</option>
                  <option value="dozens">dozens</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="condition">Product Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
              >
                <option value="excellent">🌟 Excellent - Premium quality</option>
                <option value="good">👍 Good - Minor cosmetic flaws</option>
                <option value="fair">⚠️ Fair - Still safe and nutritious</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Describe your produce: variety, harvest date, growing conditions, etc."
            />
          </div>
        </div>

        {/* NEW: Image Upload Section (matching donor form) */}
        <div className="form-section">
          <h3><FaCamera /> Product Photos</h3>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Add photos of your produce to help recipients see what they're claiming
          </p>
          
          <div 
            className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="images"
              name="images"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="images" className="upload-label">
              <div className="upload-icon">📸</div>
              <p>Click to upload photos or drag and drop</p>
              <small>JPG, PNG (max 5MB each)</small>
            </label>
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((image) => (
                <div key={image.id} className="image-preview">
                  <img
                    src={image.url}
                    alt="Farm produce preview"
                  />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(image.id)}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                  <div className="image-name">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Farm Specific Details */}
        <div className="form-section">
          <h3><FaLeaf /> Farm Details</h3>
          <div className="form-grid">
            <div className="checkbox-field">
              <input
                type="checkbox"
                id="organicCertified"
                name="organicCertified"
                checked={formData.organicCertified}
                onChange={handleInputChange}
              />
              <label htmlFor="organicCertified">
                🌱 Organic Certified / Naturally Grown
              </label>
            </div>

            <div className="form-field">
              <label htmlFor="storageConditions">Storage Requirements</label>
              <select
                id="storageConditions"
                name="storageConditions"
                value={formData.storageConditions}
                onChange={handleInputChange}
              >
                <option value="room-temperature">🌡️ Room Temperature</option>
                <option value="cool-dry">❄️ Cool & Dry</option>
                <option value="refrigerated">🧊 Refrigerated</option>
                <option value="frozen">🥶 Frozen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timing Details */}
        <div className="form-section">
          <h3><FaClock /> Pickup Schedule</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="pickupDate">Available From *</label>
              <input
                type="date"
                id="pickupDate"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleInputChange}
                min={getTomorrowDate()}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="pickupTime">Preferred Time</label>
              <select
                id="pickupTime"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
              >
                <option value="06:00">6:00 AM - Early Morning</option>
                <option value="09:00">9:00 AM - Morning</option>
                <option value="12:00">12:00 PM - Midday</option>
                <option value="15:00">3:00 PM - Afternoon</option>
                <option value="18:00">6:00 PM - Evening</option>
                <option value="flexible">Flexible - Contact me</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="expiryDate">Best Before Date (optional)</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={formData.pickupDate || getTomorrowDate()}
              />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="form-section">
          <h3><FaTractor /> Farm Location & Contact</h3>
          <div className="form-field">
            <label htmlFor="pickupAddress">Farm/Pickup Address *</label>
            <textarea
              id="pickupAddress"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleInputChange}
              rows="3"
              placeholder="Complete farm address with any specific directions"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="contactPerson">Contact Person *</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="contactPhone">Phone Number *</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="specialInstructions">Special Instructions</label>
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              rows="2"
              placeholder="Access instructions, loading requirements, or any special notes for collectors"
            />
          </div>
        </div>

        {/* Sharing Options */}
        <div className="form-section">
          <h3>🤝 Sharing Preferences</h3>
          <div className="checkbox-field">
            <input
              type="checkbox"
              id="forFarmers"
              name="forFarmers"
              checked={formData.forFarmers}
              onChange={handleInputChange}
            />
            <label htmlFor="forFarmers">
              🚜 Make available to other farmers only (exclude NGOs)
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>⏳ Listing Your Donation...</>
            ) : (
              <><FaHeart /> Share with Community</>
            )}
          </button>
        </div>

        {/* Impact Message */}
        <div className="donation-impact">
          <div className="impact-card">
            <FaTractor />
            <div>
              <h4>Make a Difference</h4>
              <p>Your surplus produce can feed families in need and reduce food waste in your community. Every donation creates a ripple effect of positive impact! 🌱</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FarmerDonationForm;

  