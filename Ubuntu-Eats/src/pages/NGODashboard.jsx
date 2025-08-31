import React, { useState } from "react";
import NGOProfile from "./NGOProfile";
import AvailableDonations from "./AvailableDonations";
import ClaimedDonations from "./ClaimedDonations";
import "../styles/NGODashboard.css";

const NGODashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [ngoData, setNgoData] = useState({
    name: "Hope Community Center",
    email: "contact@hopecommunity.org",
    phone: "+27 11 987 6543",
    address: "456 Oak Ave, Johannesburg, Gauteng",
    registrationNumber: "NPO-123-456",
    beneficiaries: "250 families weekly",
  });

  // Mock data for available donations
  const [availableDonations, setAvailableDonations] = useState([
    {
      id: 1,
      donorName: "Green Valley Restaurant",
      foodType: "Fresh Sandwiches",
      quantity: "20 units",
      category: "fresh-meals",
      expiryDate: "2025-08-31",
      pickupTime: "2025-08-31 14:00",
      location: "123 Main St, Johannesburg",
      distance: "2.3 km",
      specialInstructions: "Ask for manager at back entrance",
      status: "available",
    },
    {
      id: 2,
      donorName: "Sunshine Bakery",
      foodType: "Assorted Pastries",
      quantity: "15 kg",
      category: "bakery",
      expiryDate: "2025-09-01",
      pickupTime: "2025-08-31 16:00",
      location: "789 Bread St, Johannesburg",
      distance: "4.1 km",
      specialInstructions: "Pick up from side door after 4 PM",
      status: "available",
    },
    {
      id: 3,
      donorName: "Fresh Market",
      foodType: "Mixed Vegetables",
      quantity: "30 kg",
      category: "fruits-vegetables",
      expiryDate: "2025-09-02",
      pickupTime: "2025-09-01 10:00",
      location: "321 Produce Ave, Johannesburg",
      distance: "5.7 km",
      specialInstructions: "Available in crates near loading bay",
      status: "available",
    },
  ]);

  // Mock data for claimed donations
  const [claimedDonations, setClaimedDonations] = useState([
    {
      id: 101,
      donorName: "City Cafe",
      foodType: "Prepared Meals",
      quantity: "25 portions",
      category: "fresh-meals",
      expiryDate: "2025-08-30",
      pickupTime: "2025-08-30 15:00",
      location: "555 Urban St, Johannesburg",
      distance: "3.2 km",
      specialInstructions: "Ring bell twice for kitchen",
      status: "claimed",
      claimDate: "2025-08-30 10:30",
      collectionMethod: "self", // or "volunteer"
      volunteerAssigned: null,
    },
  ]);

  const claimDonation = (donationId) => {
    const donation = availableDonations.find((d) => d.id === donationId);
    if (donation) {
      // Remove from available
      setAvailableDonations((prev) => prev.filter((d) => d.id !== donationId));

      // Add to claimed with additional info
      const claimedDonation = {
        ...donation,
        status: "claimed",
        claimDate: new Date().toISOString(),
        collectionMethod: "pending", // To be set by NGO
        volunteerAssigned: null,
      };

      setClaimedDonations((prev) => [...prev, claimedDonation]);
    }
  };

  const setCollectionMethod = (donationId, method) => {
    setClaimedDonations((prev) =>
      prev.map((donation) =>
        donation.id === donationId
          ? { ...donation, collectionMethod: method }
          : donation
      )
    );
  };

  const confirmCollection = (donationId) => {
    setClaimedDonations((prev) =>
      prev.map((donation) =>
        donation.id === donationId
          ? { ...donation, status: "collected" }
          : donation
      )
    );
  };

  const cancelClaim = (donationId) => {
    const donation = claimedDonations.find((d) => d.id === donationId);
    if (donation) {
      // Remove from claimed
      setClaimedDonations((prev) => prev.filter((d) => d.id !== donationId));

      // Add back to available
      const availableDonation = {
        ...donation,
        status: "available",
        claimDate: undefined,
        collectionMethod: undefined,
        volunteerAssigned: undefined,
      };

      setAvailableDonations((prev) => [...prev, availableDonation]);
    }
  };

  return (
    <div className="ngo-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">NGO Dashboard</h1>
          <p className="welcome-text">Welcome, {ngoData.name}!</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{availableDonations.length}</span>
            <span className="stat-label">Available Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{claimedDonations.length}</span>
            <span className="stat-label">Claimed Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">1,250</span>
            <span className="stat-label">Meals Provided</span>
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
          className={`nav-tab ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Available Donations ({availableDonations.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "claimed" ? "active" : ""}`}
          onClick={() => setActiveTab("claimed")}
        >
          My Claims ({claimedDonations.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "profile" && (
          <NGOProfile ngoData={ngoData} setNgoData={setNgoData} />
        )}

        {activeTab === "available" && (
          <AvailableDonations
            donations={availableDonations}
            onClaim={claimDonation}
          />
        )}

        {activeTab === "claimed" && (
          <ClaimedDonations
            donations={claimedDonations}
            onSetCollectionMethod={setCollectionMethod}
            onConfirmCollection={confirmCollection}
            onCancelClaim={cancelClaim}
          />
        )}
      </main>
    </div>
  );
};

export default NGODashboard;
