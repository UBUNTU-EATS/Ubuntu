import React, { useState } from "react";
import "../styles/DonorProfile.css";

const DonorProfile = ({ donorData, setDonorData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(donorData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setDonorData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(donorData);
    setIsEditing(false);
  };

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-text">{donorData.name.charAt(0)}</span>
        </div>
        <div className="profile-info">
          <h2>{donorData.name}</h2>
          <span className="business-type">{donorData.businessType}</span>
        </div>
        <button 
          className="edit-btn"
          onClick={() => setIsEditing(true)}
          disabled={isEditing}
        >
          Edit Profile
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Business Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="businessType">Business Type</label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Supermarket">Supermarket</option>
              <option value="Bakery">Bakery</option>
              <option value="Grocery Store">Grocery Store</option>
              <option value="Food Manufacturer">Food Manufacturer</option>
              <option value="Catering Company">Catering Company</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="address">Business Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="3"
              required
            />
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        )}
      </form>

      <div className="profile-stats">
        <h3>Your Impact</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">47</span>
            <span className="stat-desc">Total Donations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">1,234</span>
            <span className="stat-desc">Meals Provided</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">89%</span>
            <span className="stat-desc">Pickup Success Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">4.8</span>
            <span className="stat-desc">Average Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;