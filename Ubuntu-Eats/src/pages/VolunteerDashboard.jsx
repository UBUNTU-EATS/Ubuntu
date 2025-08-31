import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../firebase";
import "../styles/VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // "available", "accepted", "completed"
  const [availablePickups, setAvailablePickups] = useState([]);
  const [acceptedPickups, setAcceptedPickups] = useState([]);
  const [completedPickups, setCompletedPickups] = useState([]);

  // Initialize Firestore and Auth
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Mock data for demonstration
  const mockAvailablePickups = [
    {
      id: "pickup-1",
      title: "Fresh Sandwiches & Salads",
      donorName: "City Cafe",
      pickupAddress: "123 Main Street, Downtown",
      quantity: 20,
      weightKg: 8,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "available",
      instructions: "Pick up from back entrance. Ask for Manager John.",
      createdAt: new Date(),
    },
    {
      id: "pickup-2",
      title: "Assorted Pastries",
      donorName: "The Sweet Bakery",
      pickupAddress: "456 Oak Avenue, Midtown",
      quantity: 15,
      weightKg: 5,
      expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: "available",
      instructions: "Boxes are prepared near the cash register.",
      createdAt: new Date(),
    },
  ];

  const mockAcceptedPickups = [
    {
      id: "pickup-3",
      title: "Mixed Vegetables",
      donorName: "Green Grocers",
      pickupAddress: "789 Market Street, Uptown",
      quantity: 30,
      weightKg: 12,
      expiryTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "accepted",
      instructions: "Pick up from loading dock. Call 555-1234 when arrived.",
      acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  ];

  const mockCompletedPickups = [
    {
      id: "pickup-4",
      title: "Dairy Products",
      donorName: "Fresh Mart",
      pickupAddress: "321 Dairy Lane, Westside",
      quantity: 25,
      weightKg: 10,
      status: "completed",
      instructions: "Delivered to Community Center",
      acceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // For demo purposes, use mock data
      if (currentUser) {
        setAvailablePickups(mockAvailablePickups);
        setAcceptedPickups(mockAcceptedPickups);
        setCompletedPickups(mockCompletedPickups);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptPickup = async (pickupId) => {
    try {
      // In a real app, this would update Firebase
      const pickup = availablePickups.find((p) => p.id === pickupId);
      if (pickup) {
        // Remove from available
        setAvailablePickups(availablePickups.filter((p) => p.id !== pickupId));

        // Add to accepted with acceptance timestamp
        const acceptedPickup = {
          ...pickup,
          status: "accepted",
          acceptedAt: new Date(),
          acceptedBy: user.displayName || user.email,
        };

        setAcceptedPickups([...acceptedPickups, acceptedPickup]);
        alert(`You've accepted the pickup from ${pickup.donorName}`);
      }
    } catch (error) {
      console.error("Error accepting pickup:", error);
      alert("Error accepting pickup. Please try again.");
    }
  };

  const handleMarkCompleted = async (pickupId) => {
    try {
      // In a real app, this would update Firebase
      const pickup = acceptedPickups.find((p) => p.id === pickupId);
      if (pickup) {
        // Remove from accepted
        setAcceptedPickups(acceptedPickups.filter((p) => p.id !== pickupId));

        // Add to completed with completion timestamp
        const completedPickup = {
          ...pickup,
          status: "completed",
          completedAt: new Date(),
        };

        setCompletedPickups([...completedPickups, completedPickup]);
        alert(`Pickup from ${pickup.donorName} marked as completed!`);
      }
    } catch (error) {
      console.error("Error completing pickup:", error);
      alert("Error completing pickup. Please try again.");
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="volunteer-dashboard">
      <nav className="navbar">
        <Link to="/" className="logo">
          UBUNTU-EATS
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/receiver-dashboard">Find Donations</Link>
          {user && <span>Welcome, {user.displayName || user.email}</span>}
        </div>
      </nav>

      <div className="dashboard-header">
        <h1>Volunteer Pickup Management</h1>
        <p>Accept pickups, track your deliveries, and help fight food waste</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "available" ? "active" : ""}
          onClick={() => setActiveTab("available")}
        >
          Available Pickups ({availablePickups.length})
        </button>
        <button
          className={activeTab === "accepted" ? "active" : ""}
          onClick={() => setActiveTab("accepted")}
        >
          My Pickups ({acceptedPickups.length})
        </button>
        <button
          className={activeTab === "completed" ? "active" : ""}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedPickups.length})
        </button>
      </div>

      <div className="pickups-container">
        {activeTab === "available" && (
          <div className="pickups-list">
            <h2>Available for Pickup</h2>
            {availablePickups.length > 0 ? (
              availablePickups.map((pickup) => (
                <div key={pickup.id} className="pickup-card">
                  <div className="pickup-info">
                    <h3>{pickup.title}</h3>
                    <p className="donor-name">
                      From: <strong>{pickup.donorName}</strong>
                    </p>
                    <p className="pickup-address">{pickup.pickupAddress}</p>
                    <div className="pickup-details">
                      <span className="quantity">{pickup.quantity} items</span>
                      <span className="weight">({pickup.weightKg} kg)</span>
                    </div>
                    {pickup.expiryTime && (
                      <p className="expiry">
                        Expires: {formatDate(pickup.expiryTime)} at{" "}
                        {formatTime(pickup.expiryTime)}
                      </p>
                    )}
                    {pickup.instructions && (
                      <div className="instructions">
                        <strong>Instructions:</strong> {pickup.instructions}
                      </div>
                    )}
                  </div>
                  <div className="pickup-actions">
                    <button
                      onClick={() => handleAcceptPickup(pickup.id)}
                      className="accept-btn"
                    >
                      Accept Pickup
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No available pickups at the moment.</p>
                <p>Check back later for new donation opportunities.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "accepted" && (
          <div className="pickups-list">
            <h2>Your Accepted Pickups</h2>
            {acceptedPickups.length > 0 ? (
              acceptedPickups.map((pickup) => (
                <div key={pickup.id} className="pickup-card accepted">
                  <div className="pickup-info">
                    <h3>{pickup.title}</h3>
                    <p className="donor-name">
                      From: <strong>{pickup.donorName}</strong>
                    </p>
                    <p className="pickup-address">{pickup.pickupAddress}</p>
                    <div className="pickup-details">
                      <span className="quantity">{pickup.quantity} items</span>
                      <span className="weight">({pickup.weightKg} kg)</span>
                    </div>
                    {pickup.expiryTime && (
                      <p className="expiry">
                        Expires: {formatDate(pickup.expiryTime)} at{" "}
                        {formatTime(pickup.expiryTime)}
                      </p>
                    )}
                    {pickup.instructions && (
                      <div className="instructions">
                        <strong>Instructions:</strong> {pickup.instructions}
                      </div>
                    )}
                    <p className="accepted-time">
                      Accepted on: {formatDate(pickup.acceptedAt)} at{" "}
                      {formatTime(pickup.acceptedAt)}
                    </p>
                  </div>
                  <div className="pickup-actions">
                    <button
                      onClick={() => handleMarkCompleted(pickup.id)}
                      className="complete-btn"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>You haven't accepted any pickups yet.</p>
                <p>Check the "Available Pickups" tab to get started!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="pickups-list">
            <h2>Completed Pickups</h2>
            {completedPickups.length > 0 ? (
              completedPickups.map((pickup) => (
                <div key={pickup.id} className="pickup-card completed">
                  <div className="pickup-info">
                    <h3>{pickup.title}</h3>
                    <p className="donor-name">
                      From: <strong>{pickup.donorName}</strong>
                    </p>
                    <p className="pickup-address">{pickup.pickupAddress}</p>
                    <div className="pickup-details">
                      <span className="quantity">{pickup.quantity} items</span>
                      <span className="weight">({pickup.weightKg} kg)</span>
                    </div>
                    <p className="completed-time">
                      Completed on: {formatDate(pickup.completedAt)} at{" "}
                      {formatTime(pickup.completedAt)}
                    </p>
                    <p className="accepted-time">
                      Accepted on: {formatDate(pickup.acceptedAt)} at{" "}
                      {formatTime(pickup.acceptedAt)}
                    </p>
                  </div>
                  <div className="pickup-status">
                    <span className="status-badge completed">Delivered</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>You haven't completed any pickups yet.</p>
                <p>Your completed deliveries will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Pickups</h3>
          <p className="stat-number">
            {availablePickups.length +
              acceptedPickups.length +
              completedPickups.length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-number">{completedPickups.length}</p>
        </div>
        <div className="stat-card">
          <h3>Food Saved</h3>
          <p className="stat-number">
            {completedPickups.reduce(
              (total, pickup) => total + pickup.weightKg,
              0
            )}{" "}
            kg
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
