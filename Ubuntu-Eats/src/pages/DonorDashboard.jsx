import React, { useState } from "react";
import DonorProfile from "./DonorProfile";
import DonationForm from "./DonorForm";
import ActiveDonations from "./ActiveDonations";
import "../styles/DonorDashboard.css";

const DonorDashboard = () => {
  const [activeTab, setActiveTab] = useState("donate");
  const [donorData, setDonorData] = useState({
    name: "Green Valley Restaurant",
    email: "info@greenvalley.com",
    phone: "+27 11 123 4567",
    address: "123 Main St, Johannesburg, Gauteng",
    businessType: "Restaurant",
  });

  const [donations, setDonations] = useState([
    {
      id: 1,
      foodType: "Fresh Sandwiches",
      quantity: "20 units",
      status: "Pending Pickup",
      scheduledTime: "2025-08-31 14:00",
      location: "Green Valley Restaurant",
    },
  ]);

  const addDonation = (newDonation) => {
    const donation = {
      ...newDonation,
      id: Date.now(),
      status: "Pending Pickup",
    };
    setDonations([...donations, donation]);
    setActiveTab("active"); // Switch to active donations tab
  };

  return (
    <div className="donor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Donor Dashboard</h1>
          <p className="welcome-text">Welcome back, {donorData.name}!</p>
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
          <DonorProfile donorData={donorData} setDonorData={setDonorData} />
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
