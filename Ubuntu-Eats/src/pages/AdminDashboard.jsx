import React, { useState } from "react";
import UserManagement from "./UserManagement";
import DonationApprovals from "./DonationApprovals";
import SystemAnalytics from "./SystemAnalytics";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [adminData] = useState({
    name: "Admin User",
    role: "System Administrator",
    lastLogin: new Date().toISOString(),
  });

  // Mock statistics
  const [stats] = useState({
    pendingUsers: 12,
    pendingApprovals: 8,
    totalUsers: 156,
    totalDonations: 245,
    mealsSaved: 1250,
  });

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="welcome-text">Welcome, {adminData.name}!</p>
          <p className="admin-role">{adminData.role}</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.pendingUsers}</span>
            <span className="stat-label">Pending Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.pendingApprovals}</span>
            <span className="stat-label">Pending Approvals</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalDonations}</span>
            <span className="stat-label">Total Donations</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
        <button
          className={`nav-tab ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          Donation Approvals
        </button>
        <button
          className={`nav-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          System Analytics
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "users" && <UserManagement />}

        {activeTab === "approvals" && <DonationApprovals />}

        {activeTab === "analytics" && <SystemAnalytics />}
      </main>
    </div>
  );
};

export default AdminDashboard;
