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
  const [stats, setStats] = useState({
    pendingUsers: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalDonations: 0,
    mealsSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          console.warn("No authenticated user. Redirecting...");
          navigate("/");
          return;
        }

        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn("User document not found. Redirecting...");
          navigate("/");
          return;
        }

        const data = userSnap.data();

        if (data.role?.toLowerCase() !== "admin") {
          console.warn("Access denied. User is not an admin.");
          navigate("/");
          return;
        }

        // Set user data
        setAdminData(data);

        // Simulate fetching stats (replace with real DB queries)
        setStats({
          pendingUsers: 12,
          pendingApprovals: 8,
          totalUsers: 156,
          totalDonations: 245,
          mealsSaved: 1250,
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading) {
    return (
      <section className="loading">
        <LoadingDots numDots={10} radius={60} speed={0.6} size={20} />
      </section>
    );
  }

  if (!adminData) {
    return (
      <div className="dashboard-error">
        Error loading dashboard data. Please try again later.
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="welcome-text">Welcome, {adminData.name || "Admin"}!</p>
          <p className="admin-role">{adminData.role}</p>
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
        <div className="header-stats">
          {[
            { label: "Pending Users", value: stats.pendingUsers },
            { label: "Pending Approvals", value: stats.pendingApprovals },
            { label: "Total Users", value: stats.totalUsers },
            { label: "Total Donations", value: stats.totalDonations },
          ].map((stat, idx) => (
            <div key={idx} className="stat-card">
              <span className="stat-number">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        {[
          { key: "users", label: "User Management" },
          { key: "approvals", label: "Donation Approvals" },
          { key: "analytics", label: "System Analytics" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
