import React, { useState, useEffect } from "react";
import "../styles/NGOProfile.css";
import { useNavigate } from "react-router-dom";

import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const NGOProfile = () => {
  const navigate = useNavigate();
  const [ngoData, setNgoData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNGO = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User not logged in");
          setLoading(false);
          return;
        }

        const docRef = doc(db, "users", user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role !== "ngo") {
            console.error("This user is not registered as an NGO.");
            setLoading(false);
            return;
          }
          setNgoData(data);
          setFormData(data);
        } else {
          console.error("No NGO profile found for this user.");
        }
      } catch (err) {
        console.error("Error fetching NGO profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNGO();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.email);
      await updateDoc(docRef, formData);

      setNgoData(formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating NGO profile:", err);
    }
  };

  const handleCancel = () => {
    setFormData(ngoData);
    setIsEditing(false);
  };

  if (loading) return <p>Loading NGO Profile...</p>;
  if (!ngoData) return <p>No NGO profile found.</p>;

  const verified = ngoData.status === "verified";

  return (
    <div className="ngo-profile">
     <div className="profile-header">
  <div className="header-left">
    <h2>Organization Profile</h2>
    <p>Manage your organization's information and preferences</p>
  </div>

  <div className="header-right">
<button
  className="logout-btn"
  onClick={async () => {
    await auth.signOut();
    navigate("/"); // replace "/" with your landing page route
  }}
>
  Logout
</button>
  </div>
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
                    value={formData.name || ""}
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
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
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
                    value={formData.registrationNumber || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="beneficiaries">Beneficiaries Served *</label>
                  <input
                    type="text"
                    id="beneficiaries"
                    name="beneficiaries"
                    value={formData.beneficiaries || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 250 families weekly"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="areasOfFocus">Areas of Focus *</label>
                  <input
                    type="text"
                    id="areasOfFocus"
                    name="areasOfFocus"
                    value={formData.areasOfFocus || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., Food Security, Education"
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
                  <span className="info-value">{ngoData.registrationNumber}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Contact Person:</span>
                  <span className="info-value">{ngoData.contactPerson}</span>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{ngoData.address}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Website:</span>
                  <span className="info-value">{ngoData.website || "N/A"}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Beneficiaries:</span>
                  <span className="info-value">{ngoData.beneficiaries}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Areas of Focus:</span>
                  <span className="info-value">{ngoData.areasOfFocus}</span>
                </div>
              </div>

              <div className="verification-status">
                <div className={`status-badge ${verified ? "verified" : "pending"}`}>
                  <span className="status-icon">{verified ? "✅" : "⌛"}</span>
                  {verified ? "Verified Organization" : "Verification Pending"}
                </div>
                {!verified && (
                  <p className="status-note">
                    Your organization is awaiting admin verification.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Optional Impact Stats (placeholder) */}
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
