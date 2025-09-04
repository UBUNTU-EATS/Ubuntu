import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaTractor, FaLeaf, FaEdit, FaSave, FaTimes, FaSignOutAlt } from "react-icons/fa";

const FarmerProfile = ({ farmerData, setFarmerData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...farmerData });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, formData);

      setFarmerData(formData);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...farmerData });
    setIsEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      auth.signOut();
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-icon">
          <FaTractor />
        </div>
        <div className="profile-title">
          <h2>Farm Profile</h2>
          <p>Manage your farm information and settings</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>Farm Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Farm/Organization Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              ) : (
                <span className="profile-value">{farmerData.name || "Not provided"}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Farm Type</label>
              {isEditing ? (
                <select
                  name="farmType"
                  value={formData.farmType || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                >
                  <option value="">Select Farm Type</option>
                  <option value="Crop Farming">Crop Farming</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Mixed Farming">Mixed Farming</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Organic Farming">Organic Farming</option>
                  <option value="Aquaculture">Aquaculture</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span className="profile-value">{farmerData.farmType || "Not specified"}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Farm Size (hectares)</label>
              {isEditing ? (
                <input
                  type="text"
                  name="farmSize"
                  value={formData.farmSize || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="e.g., 25 hectares"
                />
              ) : (
                <span className="profile-value">{farmerData.farmSize || "Not provided"}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Registration Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              ) : (
                <span className="profile-value">{farmerData.registrationNumber || "Not provided"}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Contact Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Email Address</label>
              <span className="profile-value">{farmerData.email}</span>
              <small className="field-note">Email cannot be changed</small>
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              ) : (
                <span className="profile-value">{farmerData.phone || "Not provided"}</span>
              )}
            </div>

            <div className="profile-field full-width">
              <label>Farm Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  rows="3"
                  placeholder="Enter your complete farm address"
                />
              ) : (
                <span className="profile-value">{farmerData.address || "Not provided"}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Farming Details</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Primary Crops/Products</label>
              {isEditing ? (
                <textarea
                  name="primaryProducts"
                  value={formData.primaryProducts || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  rows="2"
                  placeholder="e.g., Maize, Vegetables, Dairy products"
                />
              ) : (
                <span className="profile-value">{farmerData.primaryProducts || "Not specified"}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Farming Experience (years)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="farmingExperience"
                  value={formData.farmingExperience || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  min="0"
                />
              ) : (
                <span className="profile-value">
                  {farmerData.farmingExperience ? `${farmerData.farmingExperience} years` : "Not provided"}
                </span>
              )}
            </div>

            <div className="profile-field">
              <label>Organic Certification</label>
              {isEditing ? (
                <select
                  name="organicCertified"
                  value={formData.organicCertified || "no"}
                  onChange={handleInputChange}
                  className="profile-input"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                  <option value="in-progress">In Progress</option>
                </select>
              ) : (
                <span className="profile-value">
                  {farmerData.organicCertified === "yes" ? "✅ Certified" : 
                   farmerData.organicCertified === "in-progress" ? "🔄 In Progress" : "❌ Not Certified"}
                </span>
              )}
            </div>

            <div className="profile-field full-width">
              <label>Additional Notes</label>
              {isEditing ? (
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  rows="3"
                  placeholder="Any additional information about your farming practices, certifications, or special requirements"
                />
              ) : (
                <span className="profile-value">{farmerData.additionalNotes || "No additional notes"}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Account Status</h3>
          <div className="status-info">
            <div className="status-item">
              <span className="status-label">Account Status:</span>
              <span className={`status-badge ${farmerData.status}`}>
                {farmerData.status === "approved" ? "✅ Approved" : 
                 farmerData.status === "pending" ? "🔄 Pending Approval" : 
                 "❌ " + farmerData.status}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Member Since:</span>
              <span className="status-value">
                {farmerData.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="save-btn"
                disabled={saving}
              >
                <FaSave /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleCancel} className="cancel-btn">
                <FaTimes /> Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              <FaEdit /> Edit Profile
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;