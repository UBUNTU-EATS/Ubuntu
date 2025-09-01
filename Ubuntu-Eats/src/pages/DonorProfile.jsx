// DonorProfile.jsx
import React, { useState, useEffect } from "react";
import "../styles/DonorProfile.css";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const DonorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [donorData, setDonorData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDonorData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.email);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role === "individual" || data.role === "company") {
              setDonorData(data);
              setFormData(data);
            } else {
              console.warn("This user is not a donor.");
            }
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.email);
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

  // Logout function
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/"); // redirect to landing page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!donorData) return <div className="profile-error">Error loading profile data.</div>;

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
    <button className="logout-btn" onClick={handleLogout}>
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

  <button className="edit-btn" onClick={() => setIsEditing(true)} disabled={isEditing}>
    Edit Profile
  </button>
</div>


      <form className="profile-form" onSubmit={handleSave}>
        <div className="form-grid">
          <div className="form-group">
            <label>{isCompany ? "Contact Person Name" : "Full Name"}</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>
          )}
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
    </div>
  );
};

export default DonorProfile;
