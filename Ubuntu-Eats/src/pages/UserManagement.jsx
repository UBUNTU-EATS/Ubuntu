import React, { useState } from "react";
import "../styles/UserManagement.css";

const UserManagement = () => {
  const [userFilter, setUserFilter] = useState("pending");
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock user data
  const [users] = useState([
    {
      id: 1,
      name: "Green Valley Restaurant",
      email: "contact@greenvalley.com",
      type: "donor",
      status: "pending",
      registrationDate: "2025-08-25",
      address: "123 Main St, Johannesburg",
      documents: ["business_license.pdf", "tax_certificate.pdf"],
      description: "Local restaurant with daily surplus food",
    },
    {
      id: 2,
      name: "Hope Community Center",
      email: "info@hopecommunity.org",
      type: "ngo",
      status: "pending",
      registrationDate: "2025-08-26",
      address: "456 Oak Ave, Johannesburg",
      documents: ["npo_certificate.pdf", "director_id.pdf"],
      description: "Non-profit serving 250 families weekly",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      type: "volunteer",
      status: "pending",
      registrationDate: "2025-08-27",
      address: "789 Volunteer St, Johannesburg",
      documents: ["id_document.pdf", "background_check.pdf"],
      description: "Available weekends for food deliveries",
    },
    {
      id: 4,
      name: "Green Fields Farm",
      email: "contact@greenfieldsfarm.co.za",
      type: "farmer",
      status: "pending",
      registrationDate: "2025-08-28",
      address: "321 Farm Road, Pretoria",
      documents: ["farming_license.pdf", "property_deeds.pdf"],
      description: "Mixed livestock farm accepting food waste",
    },
    {
      id: 5,
      name: "City Supermarket",
      email: "manager@citysupermarket.com",
      type: "donor",
      status: "approved",
      registrationDate: "2025-08-20",
      address: "555 Retail St, Johannesburg",
      documents: ["business_license.pdf", "tax_certificate.pdf"],
      description: "Large supermarket with daily food surplus",
    },
    {
      id: 6,
      name: "Community Kitchen",
      email: "info@communitykitchen.org",
      type: "ngo",
      status: "approved",
      registrationDate: "2025-08-18",
      address: "777 Kitchen Rd, Johannesburg",
      documents: ["npo_certificate.pdf", "director_id.pdf"],
      description: "Serving meals to homeless population",
    },
  ]);

  const filteredUsers = users.filter((user) => {
    if (userFilter === "all") return true;
    return user.status === userFilter;
  });

  const approveUser = (userId) => {
    // In a real app, this would update the user status in the database
    console.log(`Approving user ${userId}`);
    setSelectedUser(null);
  };

  const rejectUser = (userId) => {
    // In a real app, this would update the user status in the database
    console.log(`Rejecting user ${userId}`);
    setSelectedUser(null);
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case "donor":
        return "🏪";
      case "ngo":
        return "🤝";
      case "volunteer":
        return "🚗";
      case "farmer":
        return "🚜";
      default:
        return "👤";
    }
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case "donor":
        return "Food Donor";
      case "ngo":
        return "NGO/Receiver";
      case "volunteer":
        return "Volunteer";
      case "farmer":
        return "Farmer";
      default:
        return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="status-badge pending">Pending Review</span>;
      case "approved":
        return <span className="status-badge approved">Approved</span>;
      case "rejected":
        return <span className="status-badge rejected">Rejected</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Review and manage user registrations</p>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="userFilter">Filter by Status:</label>
          <select
            id="userFilter"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="results-count">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
          found
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-users">
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No users found</h3>
                    <p>No users match the current filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="user-row">
                  <td>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-type">
                      <span className="type-icon">
                        {getUserTypeIcon(user.type)}
                      </span>
                      {getUserTypeLabel(user.type)}
                    </div>
                  </td>
                  <td>
                    <div className="registration-date">
                      {formatDate(user.registrationDate)}
                    </div>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                      {user.status === "pending" && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => approveUser(user.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => rejectUser(user.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="user-detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedUser.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {getUserTypeIcon(selectedUser.type)}{" "}
                      {getUserTypeLabel(selectedUser.type)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {getStatusBadge(selectedUser.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Registration Date:</span>
                    <span className="detail-value">
                      {formatDate(selectedUser.registrationDate)}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedUser.address}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">
                      {selectedUser.description}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-detail-section">
                <h4>Documents</h4>
                <div className="documents-list">
                  {selectedUser.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <span className="document-icon">📄</span>
                      <span className="document-name">{doc}</span>
                      <button className="view-document-btn">View</button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedUser.status === "pending" && (
                <div className="modal-actions">
                  <button
                    className="modal-reject-btn"
                    onClick={() => rejectUser(selectedUser.id)}
                  >
                    Reject Application
                  </button>
                  <button
                    className="modal-approve-btn"
                    onClick={() => approveUser(selectedUser.id)}
                  >
                    Approve User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
