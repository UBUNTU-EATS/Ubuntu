import React, { useState, useEffect } from "react";
import DonorProfile from "./DonorProfile";
import DonationForm from "./DonorForm";
import ActiveDonations from "./ActiveDonations";
import "../styles/DonorDashboard.css";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("donate");
  const [donorData, setDonorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const navigate = useNavigate();

  const [donations, setDonations] = useState([
    {
      id: 1,
      foodType: "Fresh Sandwiches",
      quantity: "20 units",
      status: "Pending Pickup",
      scheduledTime: "2025-08-31 14:00",
      location: "Green Valley Restaurant"
    }
  ]);

  // Fetch donor data from Firebase
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
              setProfileFormData(data);
            } else {
              console.warn("This user is not a donor.");
              navigate("/"); // Redirect if not a donor
            }
          } else {
            console.log("No donor data found!");
            navigate("/"); // Redirect if no data
          }
        } else {
          navigate("/"); // Redirect if not authenticated
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching donor data:", error);
        setLoading(false);
        navigate("/"); // Redirect on error
      }
    };

    fetchDonorData();
  }, [navigate]);

  // Handle donation submission
  const addDonation = (newDonation) => {
    const donation = {
      ...newDonation,
      id: Date.now(),
      status: "Pending Pickup"
    };
    setDonations([...donations, donation]);
    setActiveTab("active"); // Switch to active donations tab
  };

  // Profile editing handlers
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.email);
        await updateDoc(docRef, profileFormData);
        setDonorData(profileFormData);
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error("Error updating donor data:", error);
    }
  };

  const handleProfileCancel = () => {
    setProfileFormData(donorData);
    setIsEditingProfile(false);
  };

  const startEditing = () => {
    setProfileFormData(donorData);
    setIsEditingProfile(true);
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (!donorData) return <div className="dashboard-error">Error loading dashboard data.</div>;

  const isCompany = donorData.role === "company";
  const displayName = isCompany ? donorData.companyName : donorData.name;

  return (
    <div className="donor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Donor Dashboard</h1>
          <p className="welcome-text">Welcome back, {displayName}!</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{donations.length}</span>
            <span className="stat-label">Total Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">156</span>
            <span className="stat-label">Meals Provided</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">12</span>
            <span className="stat-label">This Month</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button 
          className={`nav-tab ${activeTab === "donate" ? "active" : ""}`}
          onClick={() => setActiveTab("donate")}
        >
          Donate Food
        </button>
        <button 
          className={`nav-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Donations ({donations.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "profile" && (
          <DonorProfile 
            donorData={donorData}
            isEditing={isEditingProfile}
            formData={profileFormData}
            onInputChange={handleProfileInputChange}
            onSave={handleProfileSave}
            onCancel={handleProfileCancel}
            onStartEditing={startEditing}
            onLogout={handleLogout}
          />
        )}
        
        {activeTab === "donate" && (
          <DonationForm onSubmit={addDonation} donorData={donorData} />
        )}
        
        {activeTab === "active" && (
          <ActiveDonations donations={donations} setDonations={setDonations} />
        )}
      </main>
    </div>
  );
};

export default DonorDashboard;