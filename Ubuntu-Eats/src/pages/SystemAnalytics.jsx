import React from "react";
import "../styles/SystemAnalytics.css";

const SystemAnalytics = () => {
  // Mock analytics data
  const analyticsData = {
    totalUsers: 156,
    totalDonations: 245,
    mealsProvided: 1250,
    wasteRedirected: 560,
    activeDonors: 42,
    activeNgos: 28,
    activeVolunteers: 35,
    activeFarmers: 12,
    completionRate: 92,
  };

  const recentActivities = [
    {
      id: 1,
      type: "donation",
      description: "Green Valley Restaurant donated 20 sandwiches",
      time: "2 hours ago",
      icon: "🍽️",
    },
    {
      id: 2,
      type: "claim",
      description: "Hope Community Center claimed a donation",
      time: "4 hours ago",
      icon: "🤝",
    },
    {
      id: 3,
      type: "delivery",
      description: "Sarah Johnson completed a delivery",
      time: "5 hours ago",
      icon: "🚗",
    },
    {
      id: 4,
      type: "registration",
      description: "New farmer registered: Green Fields Farm",
      time: "1 day ago",
      icon: "🚜",
    },
    {
      id: 5,
      type: "approval",
      description: "Admin approved City Supermarket donation",
      time: "1 day ago",
      icon: "✅",
    },
  ];

  const userDistribution = {
    donors: 42,
    ngos: 28,
    volunteers: 35,
    farmers: 12,
  };

  const categoryDistribution = {
    "Fresh Meals": 45,
    "Bakery Items": 32,
    "Fruits & Vegetables": 38,
    "Dairy Products": 25,
    "Packaged Goods": 18,
    Beverages: 12,
  };

  return (
    <div className="system-analytics">
      <div className="section-header">
        <h2>System Analytics</h2>
        <p>Overview of platform performance and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalUsers}</div>
            <div className="metric-label">Total Users</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalDonations}</div>
            <div className="metric-label">Total Donations</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🍽️</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.mealsProvided}</div>
            <div className="metric-label">Meals Provided</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">♻️</div>
          <div className="metric-content">
            <div className="metric-value">
              {analyticsData.wasteRedirected} kg
            </div>
            <div className="metric-label">Waste Redirected</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.completionRate}%</div>
            <div className="metric-label">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* User Distribution */}
        <div className="analytics-card">
          <h3>User Distribution</h3>
          <div className="distribution-chart">
            {Object.entries(userDistribution).map(([type, count]) => (
              <div key={type} className="distribution-item">
                <div className="distribution-header">
                  <span className="distribution-label">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  <span className="distribution-value">{count}</span>
                </div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${(count / analyticsData.totalUsers) * 100}%`,
                      backgroundColor: getDistributionColor(type),
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="analytics-card">
          <h3>Donation Categories</h3>
          <div className="category-chart">
            {Object.entries(categoryDistribution).map(([category, count]) => (
              <div key={category} className="category-item">
                <div className="category-header">
                  <span className="category-label">{category}</span>
                  <span className="category-value">{count}</span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-fill"
                    style={{
                      width: `${(count / analyticsData.totalDonations) * 100}%`,
                      backgroundColor: getCategoryColor(category),
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="analytics-card">
          <h3>Platform Health</h3>
          <div className="health-metrics">
            <div className="health-metric">
              <span className="health-label">Uptime</span>
              <span className="health-value">99.9%</span>
              <div className="health-bar">
                <div className="health-fill" style={{ width: "99.9%" }}></div>
              </div>
            </div>
            <div className="health-metric">
              <span className="health-label">Response Time</span>
              <span className="health-value">128ms</span>
              <div className="health-bar">
                <div
                  className="health-fill excellent"
                  style={{ width: "95%" }}
                ></div>
              </div>
            </div>
            <div className="health-metric">
              <span className="health-label">Error Rate</span>
              <span className="health-value">0.2%</span>
              <div className="health-bar">
                <div
                  className="health-fill good"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for colors
const getDistributionColor = (type) => {
  switch (type) {
    case "donors":
      return "#4caf50";
    case "ngos":
      return "#2196f3";
    case "volunteers":
      return "#ff9800";
    case "farmers":
      return "#9c27b0";
    default:
      return "#607d8b";
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case "Fresh Meals":
      return "#4caf50";
    case "Bakery Items":
      return "#ff9800";
    case "Fruits & Vegetables":
      return "#8bc34a";
    case "Dairy Products":
      return "#03a9f4";
    case "Packaged Goods":
      return "#795548";
    case "Beverages":
      return "#3f51b5";
    default:
      return "#607d8b";
  }
};

export default SystemAnalytics;
