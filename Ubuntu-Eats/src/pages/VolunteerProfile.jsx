import React, { useState } from "react";
import "../styles/VolunteerProfile.css";

const VolunteerProfile = ({ volunteerData, setVolunteerData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(volunteerData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setVolunteerData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(volunteerData);
    setIsEditing(false);
  };

  return (
    <div className="volunteer-profile">
      <div className="profile-header">
        <h2>Volunteer Profile</h2>
        <p>Manage your volunteer information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header">
            <h3>Personal Information</h3>
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
                  <label htmlFor="name">Full Name *</label>
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
                  <label htmlFor="vehicleType">Vehicle Type *</label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="availability">Availability *</label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Weekends and Evenings">
                      Weekends and Evenings
                    </option>
                    <option value="Flexible">Flexible</option>
                    <option value="On Call">On Call</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maxDistance">Maximum Distance *</label>
                  <select
                    id="maxDistance"
                    name="maxDistance"
                    value={formData.maxDistance}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="10 km">10 km</option>
                    <option value="15 km">15 km</option>
                    <option value="20 km">20 km</option>
                    <option value="25 km">25 km</option>
                    <option value="30 km">30 km</option>
                    <option value="50 km">50 km</option>
                    <option value="No limit">No limit</option>
                  </select>
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
                  <span className="info-label">Name:</span>
                  <span className="info-value">{volunteerData.name}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{volunteerData.email}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{volunteerData.phone}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Vehicle Type:</span>
                  <span className="info-value">
                    {volunteerData.vehicleType}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Availability:</span>
                  <span className="info-value">
                    {volunteerData.availability}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Max Distance:</span>
                  <span className="info-value">
                    {volunteerData.maxDistance}
                  </span>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{volunteerData.address}</span>
                </div>
              </div>

              <div className="verification-status">
                <div className="status-badge verified">
                  <span className="status-icon">✅</span>
                  Verified Volunteer
                </div>
                <p className="status-note">
                  Thank you for your service to the community! Your help makes a
                  real difference.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="stats-card">
          <h3>Volunteer Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">
                {volunteerData.completedDeliveries}
              </span>
              <span className="stat-label">Completed Deliveries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">156</span>
              <span className="stat-label">Meals Delivered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Success Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.9</span>
              <span className="stat-label">Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;
