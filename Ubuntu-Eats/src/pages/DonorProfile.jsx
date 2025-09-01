import React from "react";
import "../styles/DonorProfile.css";

const DonorProfile = ({ 
  donorData, 
  isEditing, 
  formData, 
  onInputChange, 
  onSave, 
  onCancel, 
  onStartEditing,
  onLogout 
}) => {
  if (!donorData) return <div className="profile-loading">Loading profile...</div>;

  const isCompany = donorData.role === "company";

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="avatar-logout-wrapper">
          <div className="profile-avatar">
            <span className="avatar-text">
              {isCompany ? donorData.companyName?.charAt(0) || "C" : donorData.name?.charAt(0) || "U"}
            </span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="profile-info">
          <h2>{isCompany ? donorData.companyName : donorData.name}</h2>
          <span className="donor-type">{isCompany ? "Business Account" : "Individual Donor"}</span>
          {donorData.status === "verified" ? (
            <span className="verification-badge verified">Verified</span>
          ) : (
            <span className="verification-badge pending">Verification Pending</span>
          )}
        </div>

        <button className="edit-btn" onClick={onStartEditing} disabled={isEditing}>
          Edit Profile
        </button>
      </div>

      <form className="profile-form" onSubmit={onSave}>
        <div className="form-grid">
          <div className="form-group">
            <label>{isCompany ? "Contact Person Name" : "Full Name"}</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={onInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={onInputChange}
              disabled // Email should not be editable
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={onInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              value={formData.country || ""}
              onChange={onInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={onInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          {isCompany && (
            <>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={onInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  name="companyRegNumber"
                  value={formData.companyRegNumber || ""}
                  onChange={onInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="companyWebsite"
                  value={formData.companyWebsite || ""}
                  onChange={onInputChange}
                  disabled={!isEditing}
                />
              </div>
            </>
          )}

          {!isCompany && (
            <div className="form-group">
              <label>ID / Passport Number</label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber || ""}
                onChange={onInputChange}
                disabled={!isEditing}
                required
              />
            </div>
          )}
        </div>

        {isEditing && (
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DonorProfile;