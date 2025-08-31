import React, { useState } from "react";
import "../styles/NGOProfile.css";

const NGOProfile = ({ ngoData, setNgoData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(ngoData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNgoData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(ngoData);
    setIsEditing(false);
  };

  return (
    <div className="ngo-profile">
      <div className="profile-header">
        <h2>Organization Profile</h2>
        <p>Manage your organization's information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header">
            <h3>Basic Information</h3>
            {!isEditing && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Organization Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registrationNumber">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="beneficiaries">Beneficiaries Served *</label>
                  <input
                    type="text"
                    id="beneficiaries"
                    name="beneficiaries"
                    value={formData.beneficiaries}
                    onChange={handleInputChange}
                    placeholder="e.g., 250 families weekly"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Organization Name:</span>
                  <span className="info-value">{ngoData.name}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{ngoData.email}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{ngoData.phone}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Registration Number:</span>
                  <span className="info-value">
                    {ngoData.registrationNumber}
                  </span>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{ngoData.address}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Beneficiaries:</span>
                  <span className="info-value">{ngoData.beneficiaries}</span>
                </div>
              </div>

              <div className="verification-status">
                <div className="status-badge verified">
                  <span className="status-icon">✅</span>
                  Verified Organization
                </div>
                <p className="status-note">
                  Your organization has been verified by our admin team. Thank
                  you for your service to the community!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="stats-card">
          <h3>Impact Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">1,250</span>
              <span className="stat-label">Meals Provided</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">45</span>
              <span className="stat-label">Donations Received</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">12</span>
              <span className="stat-label">Active Volunteers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOProfile;
