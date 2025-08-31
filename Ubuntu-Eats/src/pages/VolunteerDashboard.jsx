import React, { useState } from "react";
import VolunteerProfile from "./VolunteerProfile";
import AvailableDeliveries from "./AvailableDeliveries";
import MyDeliveries from "./MyDeliveries";
import "../styles/VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [volunteerData, setVolunteerData] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+27 11 777 8888",
    address: "123 Volunteer St, Johannesburg, Gauteng",
    vehicleType: "SUV",
    availability: "Weekends and Evenings",
    maxDistance: "25 km",
    completedDeliveries: 12,
  });

  // Mock data for available deliveries
  const [availableDeliveries, setAvailableDeliveries] = useState([
    {
      id: 1,
      donorName: "Green Valley Restaurant",
      recipientName: "Hope Community Center",
      foodType: "Fresh Sandwiches",
      quantity: "20 units",
      category: "fresh-meals",
      pickupTime: "2025-08-31 14:00",
      pickupLocation: "123 Main St, Johannesburg",
      deliveryLocation: "456 Oak Ave, Johannesburg",
      distance: "8.2 km",
      status: "needs_delivery",
      specialInstructions: "Fragile items, handle with care",
      urgency: "high",
    },
    {
      id: 2,
      donorName: "Sunshine Bakery",
      recipientName: "Children's Shelter",
      foodType: "Assorted Pastries",
      quantity: "15 kg",
      category: "bakery",
      pickupTime: "2025-08-31 16:00",
      pickupLocation: "789 Bread St, Johannesburg",
      deliveryLocation: "321 Shelter Rd, Johannesburg",
      distance: "12.5 km",
      status: "needs_delivery",
      specialInstructions: "No special instructions",
      urgency: "medium",
    },
    {
      id: 3,
      donorName: "Fresh Market",
      recipientName: "Elderly Care Home",
      foodType: "Mixed Vegetables",
      quantity: "30 kg",
      category: "fruits-vegetables",
      pickupTime: "2025-09-01 10:00",
      pickupLocation: "321 Produce Ave, Johannesburg",
      deliveryLocation: "654 Care Lane, Johannesburg",
      distance: "15.3 km",
      status: "needs_delivery",
      specialInstructions: "Perishable items, need quick delivery",
      urgency: "high",
    },
  ]);

  // Mock data for accepted deliveries
  const [acceptedDeliveries, setAcceptedDeliveries] = useState([
    {
      id: 101,
      donorName: "City Cafe",
      recipientName: "Community Kitchen",
      foodType: "Prepared Meals",
      quantity: "25 portions",
      category: "fresh-meals",
      pickupTime: "2025-08-30 15:00",
      pickupLocation: "555 Urban St, Johannesburg",
      deliveryLocation: "777 Kitchen Rd, Johannesburg",
      distance: "9.8 km",
      status: "accepted",
      acceptedAt: "2025-08-30 14:30",
      specialInstructions: "Ring bell twice for kitchen",
      estimatedDeliveryTime: "30 minutes",
      urgency: "medium",
    },
  ]);

  const acceptDelivery = (deliveryId) => {
    const delivery = availableDeliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      // Remove from available
      setAvailableDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));

      // Add to accepted with additional info
      const acceptedDelivery = {
        ...delivery,
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        estimatedDeliveryTime: "30 minutes", // This would be calculated based on distance
      };

      setAcceptedDeliveries((prev) => [...prev, acceptedDelivery]);
    }
  };

  const confirmDelivery = (deliveryId) => {
    setAcceptedDeliveries((prev) =>
      prev.map((delivery) =>
        delivery.id === deliveryId
          ? {
              ...delivery,
              status: "delivered",
              deliveredAt: new Date().toISOString(),
            }
          : delivery
      )
    );
  };

  const cancelDelivery = (deliveryId) => {
    const delivery = acceptedDeliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      // Remove from accepted
      setAcceptedDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));

      // Add back to available
      const availableDelivery = {
        ...delivery,
        status: "needs_delivery",
        acceptedAt: undefined,
        estimatedDeliveryTime: undefined,
      };

      setAvailableDeliveries((prev) => [...prev, availableDelivery]);
    }
  };

  return (
    <div className="volunteer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Volunteer Dashboard</h1>
          <p className="welcome-text">Welcome, {volunteerData.name}!</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{availableDeliveries.length}</span>
            <span className="stat-label">Available Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{acceptedDeliveries.length}</span>
            <span className="stat-label">My Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {volunteerData.completedDeliveries}
            </span>
            <span className="stat-label">Completed</span>
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
          Available Deliveries ({availableDeliveries.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "myDeliveries" ? "active" : ""}`}
          onClick={() => setActiveTab("myDeliveries")}
        >
          My Deliveries ({acceptedDeliveries.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "profile" && (
          <VolunteerProfile
            volunteerData={volunteerData}
            setVolunteerData={setVolunteerData}
          />
        )}

        {activeTab === "available" && (
          <AvailableDeliveries
            deliveries={availableDeliveries}
            onAccept={acceptDelivery}
            maxDistance={volunteerData.maxDistance}
          />
        )}

        {activeTab === "myDeliveries" && (
          <MyDeliveries
            deliveries={acceptedDeliveries}
            onConfirmDelivery={confirmDelivery}
            onCancelDelivery={cancelDelivery}
          />
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;
