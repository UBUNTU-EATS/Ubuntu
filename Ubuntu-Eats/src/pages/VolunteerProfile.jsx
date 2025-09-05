import React, { useState, useEffect } from "react";
import "../styles/VolunteerProfile.css";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const VolunteerProfile = () => {
  const navigate = useNavigate();
  const [volunteerData, setVolunteerData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User not logged in");
          setLoading(false);
          navigate("/login");
          return;
        }

        const docRef = doc(db, "users", user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role !== "volunteer") {
            console.error("This user is not registered as a volunteer.");
            setLoading(false);
            navigate("/dashboard");
            return;
          }

          // Set data with proper defaults
          const volunteerData = {
            name: data.name || "",
            email: data.email || user.email,
            phone: data.phone || "",
            vehicleType: data.vehicleType || "Car",
            availability: data.availability || "Flexible",
            maxDistance: data.maxDistance || "20 km",
            address: data.address || "",
            city: data.city || "",
            country: data.country || "",
            completedDeliveries: data.completedDeliveries || 0,
            mealsDelivered: data.mealsDelivered || 0,
            successRate: data.successRate || "0%",
            rating: data.rating || "0.0",
            status: data.status || "pending",
            createdAt: data.createdAt || new Date(),
            // Add any other fields that might be in your database
            ...data,
          };

          setVolunteerData(volunteerData);
          setFormData(volunteerData);
        } else {
          console.error("No volunteer profile found for this user.");
          setSaveStatus({
            type: "error",
            message: "No volunteer profile found. Please contact support.",
          });
        }
      } catch (err) {
        console.error("Error fetching volunteer profile:", err);
        setSaveStatus({
          type: "error",
          message: "Failed to load profile data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteer();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus({ type: "", message: "" });

    try {
      const user = auth.currentUser;
      if (!user) {
        setSaveStatus({ type: "error", message: "User not authenticated" });
        return;
      }

      const docRef = doc(db, "users", user.email);

      // Prepare update data - only include fields that are allowed to be updated
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        availability: formData.availability,
        maxDistance: formData.maxDistance,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        updatedAt: new Date(),
      };

      await updateDoc(docRef, updateData);

      // Update local state with the new data
      const updatedData = { ...volunteerData, ...updateData };
      setVolunteerData(updatedData);
      setIsEditing(false);

      setSaveStatus({
        type: "success",
        message: "Profile updated successfully!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus({ type: "", message: "" }), 3000);
    } catch (err) {
      console.error("Error updating volunteer profile:", err);
      setSaveStatus({
        type: "error",
        message: "Failed to update profile. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setFormData(volunteerData);
    setIsEditing(false);
    setSaveStatus({ type: "", message: "" });
  };

  if (loading)
    return (
      <div className="loading-container">
        <p>Loading Volunteer Profile...</p>
      </div>
    );

  if (!volunteerData)
    return (
      <div className="error-container">
        <p>No volunteer profile found.</p>
        <button onClick={() => navigate("/")} className="home-btn">
          Go to Home
        </button>
      </div>
    );

  const verified = volunteerData.status === "approved";

  return (
    <div className="volunteer-profile">
      <div className="profile-header">
        <div className="header-left">
          <h2>Volunteer Profile</h2>
          <p>Manage your volunteer information and preferences</p>
        </div>

        <div className="header-right">
        
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.message && (
        <div className={`status-message ${saveStatus.type}`}>
          {saveStatus.message}
        </div>
      )}

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
                  <label htmlFor="vehicleType">Vehicle Type *</label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType || ""}
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
                    value={formData.availability || ""}
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
                    value={formData.maxDistance || ""}
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

                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country || ""}
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

                <div className="info-item">
                  <span className="info-label">City:</span>
                  <span className="info-value">{volunteerData.city}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Country:</span>
                  <span className="info-value">{volunteerData.country}</span>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{volunteerData.address}</span>
                </div>
              </div>

              <div className="verification-status">
                <div
                  className={`status-badge ${
                    verified ? "approved" : "pending"
                  }`}
                >
                  <span className="status-icon">{verified ? "✅" : "⌛"}</span>
                  {verified ? "Verified Volunteer" : "Verification Pending"}
                </div>
                {!verified && (
                  <p className="status-note">
                    Your volunteer account is awaiting admin verification.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="stats-card">
          <h3>Volunteer Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">
                {volunteerData.completedDeliveries || 0}
              </span>
              <span className="stat-label">Completed Deliveries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {volunteerData.mealsDelivered || 0}
              </span>
              <span className="stat-label">Meals Delivered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {volunteerData.successRate || "0%"}
              </span>
              <span className="stat-label">Success Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {volunteerData.rating || "0.0"}
              </span>
              <span className="stat-label">Rating</span>
            </div>
          </div>

          {verified && volunteerData.completedDeliveries === 0 && (
            <div className="welcome-message">
              <p>
                🎉 Welcome to Ubuntu Eats! As a verified volunteer, you'll be
                notified when delivery opportunities become available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;
