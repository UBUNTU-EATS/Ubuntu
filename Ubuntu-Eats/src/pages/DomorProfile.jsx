// DonorProfile.jsx
import React, { useState, useEffect } from "react";
import "../styles/DonorProfile.css";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";

const DonorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [donorData, setDonorData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonorData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "donors", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setDonorData(data);
            setFormData(data);
          } else {
            console.log("No such document!");
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching donor data:", error);
        setLoading(false);
      }
    };

    fetchDonorData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "donors", user.uid);
        await updateDoc(docRef, formData);
        setDonorData(formData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating donor data:", error);
    }
  };

  const handleCancel = () => {
    setFormData(donorData);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!donorData) {
    return <div className="profile-error">Error loading profile data.</div>;
  }

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-text">
            {donorData.donorType === "company"
              ? donorData.companyName?.charAt(0) || "C"
              : donorData.fullName?.charAt(0) || "U"}
          </span>
        </div>
        <div className="profile-info">
          <h2>
            {donorData.donorType === "company"
              ? donorData.companyName
              : donorData.fullName}
          </h2>
          <span className="donor-type">
            {donorData.donorType === "company"
              ? "Business Account"
              : "Individual Donor"}
          </span>
          {donorData.verified ? (
            <span className="verification-badge verified">Verified</span>
          ) : (
            <span className="verification-badge pending">
              Verification Pending
            </span>
          )}
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
            <label htmlFor="fullName">
              {donorData.donorType === "company"
                ? "Contact Person Name"
                : "Full Name"}
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ""}
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
              value={formData.phone || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>

          {donorData.donorType === "company" && (
            <>
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyRegNumber">Registration Number</label>
                <input
                  type="text"
                  id="companyRegNumber"
                  name="companyRegNumber"
                  value={formData.companyRegNumber || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyWebsite">Website</label>
                <input
                  type="url"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={formData.companyWebsite || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </>
          )}

          {donorData.donorType === "individual" && (
            <div className="form-group">
              <label htmlFor="idNumber">ID/Passport Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>
          )}

          <div className="form-group full-width">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferredDonationType">
              Preferred Donation Type
            </label>
            <select
              id="preferredDonationType"
              name="preferredDonationType"
              value={formData.preferredDonationType || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            >
              <option value="">Select donation type</option>
              <option value="monetary">Monetary</option>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
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
            <span className="stat-value">0</span>
            <span className="stat-desc">Total Donations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">0</span>
            <span className="stat-desc">Meals Provided</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">0%</span>
            <span className="stat-desc">Pickup Success Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">0</span>
            <span className="stat-desc">Average Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;
