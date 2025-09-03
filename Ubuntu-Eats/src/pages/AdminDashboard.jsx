import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import UserManagement from "./UserManagement";
import DonationApprovals from "./DonationApprovals";
import SystemAnalytics from "./SystemAnalytics";
import LoadingDots from "./loading";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock statistics (optional, you can fetch real stats from DB)
  const [stats, setStats] = useState({
    pendingUsers: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalDonations: 0,
    mealsSaved: 0,
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/"); // Not authenticated
          return;
        }

        const docRef = doc(db, "users", user.email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.warn("No admin data found!");
          navigate("/"); // User document doesn't exist
          return;
        }

        const data = docSnap.data();

        if (!data.isAdmin) {
          console.warn("User is not an admin!");
          navigate("/"); // Wrong role
          return;
        }

        setAdminData(data);

        // Optionally fetch real statistics from your DB here
        setStats({
          pendingUsers: 12,
          pendingApprovals: 8,
          totalUsers: 156,
          totalDonations: 245,
          mealsSaved: 1250,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setLoading(false);
        navigate("/"); // Redirect on error
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading)
    return (
      <section className="loading">
        <LoadingDots numDots={10} radius={60} speed={0.6} size={20} />
      </section>
    );

  if (!adminData)
    return <div className="dashboard-error">Error loading dashboard data.</div>;

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
