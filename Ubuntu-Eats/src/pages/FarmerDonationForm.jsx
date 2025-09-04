import React, { useState } from "react";
import { FaHeart, FaSeedling, FaTractor } from "react-icons/fa";

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
    contactPerson: farmerData?.name || '',
    contactPhone: farmerData?.phone || '',
    pickupAddress: farmerData?.address || '',
    specialInstructions: '',
    condition: 'excellent',
    organicCertified: farmerData?.organicCertified === 'yes',
    storageConditions: 'room-temperature'
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.foodType || !formData.category || !formData.quantity || 
          !formData.pickupDate || !formData.pickupAddress) {
        alert('Please fill in all required fields');
        return;
      }

      // Ensure pickup date is not in the past
      const pickupDateTime = new Date(`${formData.pickupDate} ${formData.pickupTime}`);
      if (pickupDateTime <= new Date()) {
        alert('Pickup date and time must be in the future');
        return;
      }

      await onSubmit(formData);

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
        contactPerson: farmerData?.name || '',
        contactPhone: farmerData?.phone || '',
        pickupAddress: farmerData?.address || '',
        specialInstructions: '',
        condition: 'excellent',
        organicCertified: farmerData?.organicCertified === 'yes',
        storageConditions: 'room-temperature'
      });

    } catch (error) {
      console.error("Error submitting donation:", error);
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

      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-section">
          <h3>🌱 Product Details</h3>
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
                <option value="vegetables">Fresh Vegetables</option>
                <option value="fruits">Fresh Fruits</option>
                <option value="herbs">Herbs & Spices</option>
                <option value="grains">Grains & Legumes</option>
                <option value="dairy">Dairy Products</option>
                <option value="eggs">Eggs</option>
                <option value="meat">Meat & Poultry</option>
                <option value="processed">Processed Foods</option>
                <option value="other">Other</option>
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
                  placeholder="Enter amount"
                  min="1"
                  required
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="unit-select"
                >
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="boxes">boxes</option>
                  <option value="bags">bags</option>
                  <option value="pieces">pieces</option>
                  <option value="liters">liters</option>
                  <option value="dozens">dozens</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
              >
                <option value="excellent">Excellent - Premium quality</option>
                <option value="good">Good - Minor cosmetic imperfections</option>
                <option value="fair">Fair - Suitable for processing</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📋 Product Information</h3>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Describe your produce: variety, growing conditions, harvest date, etc."
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="expiryDate">Best Before Date</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-field">
              <label htmlFor="storageConditions">Storage Requirements</label>
              <select
                id="storageConditions"
                name="storageConditions"
                value={formData.storageConditions}
                onChange={handleInputChange}
              >
                <option value="room-temperature">Room Temperature</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="frozen">Frozen</option>
                <option value="cool-dry">Cool & Dry</option>
              </select>
            </div>
          </div>

          <div className="checkbox-field">
            <input
              type="checkbox"
              id="organicCertified"
              name="organicCertified"
              checked={formData.organicCertified}
              onChange={handleInputChange}
            />
            <label htmlFor="organicCertified">
              🌿 This product is organically certified
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>📍 Pickup Information</h3>
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
              <label htmlFor="pickupTime">Available Time *</label>
              <select
                id="pickupTime"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
                required
              >
                <option value="06:00">6:00 AM</option>
                <option value="07:00">7:00 AM</option>
                <option value="08:00">8:00 AM</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="18:00">6:00 PM</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="pickupAddress">Pickup Location *</label>
            <textarea
              id="pickupAddress"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleInputChange}
              rows="3"
              placeholder="Complete address with any specific directions"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>👤 Contact Details</h3>
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
              placeholder="Any special handling requirements, access instructions, or notes for collectors"
            />
          </div>
        </div>

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

        <div className="donation-impact">
          <div className="impact-card">
            <FaTractor />
            <div>
              <h4>Make a Difference</h4>
              <p>Your surplus produce can feed families in need and reduce food waste in your community.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FarmerDonationForm;