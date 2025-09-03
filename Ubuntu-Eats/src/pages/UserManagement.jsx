import React, { useState, useEffect } from "react";

import { db } from "../../firebaseConfig";
import "../styles/UserManagement.css";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"; // add deleteDoc

// Replace handleStatusChange with handleDeleteUser


const UserManagement = () => {
  const [userFilter, setUserFilter] = useState("pending");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        let q;

        if (userFilter === "all") {
          q = usersRef;
        } else {
          q = query(usersRef, where("status", "==", userFilter));
        }

        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userFilter]);

  // const approveUser = async (userId) => {
  //   console.log(`Approving user ${userId}`);
  //   // 🔥 You can call Firestore updateDoc here
  //   setSelectedUser(null);
  // };

  // const rejectUser = async (userId) => {
  //   console.log(`Rejecting user ${userId}`);
  //   // 🔥 You can call Firestore updateDoc here
  //   setSelectedUser(null);
  // };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case "donor": return "🏪";
      case "ngo": return "🤝";
      case "volunteer": return "🚗";
      case "farmer": return "🚜";
      default: return "👤";
    }
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
      case "donor": return "Food Donor";
      case "ngo": return "NGO/Receiver";
      case "volunteer": return "Volunteer";
      case "farmer": return "Farmer";
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="status-badge pending">Pending Review</span>;
      case "approved": return <span className="status-badge approved">Approved</span>;
      case "rejected": return <span className="status-badge rejected">Rejected</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };
const handleStatusChange = async (userId, status) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status }); // Update Firestore

    console.log(`User ${userId} updated to ${status}`);

    // Remove the user from the local state if they no longer match the current filter
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== userId)
    );

    // Close modal if open
    if (selectedUser && selectedUser.id === userId) setSelectedUser(null);
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

const handleDeleteUser = async (userId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to remove this user? This action cannot be undone."
  );
  if (!confirmDelete) return;

  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log(`User ${userId} has been deleted`);

    // Remove the user from the local state to immediately update UI
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    // Close the modal if it was open
    if (selectedUser && selectedUser.id === userId) setSelectedUser(null);

  } catch (error) {
    console.error("Error deleting user:", error);
  }
};
  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-ZA", {
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
          {users.length} user{users.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
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
                users.map((user) => (
                  <tr key={user.id} className="user-row">
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="user-type">
                        <span className="type-icon">{getUserTypeIcon(user.type)}</span>
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
      onClick={() => handleStatusChange(user.id, "approved")}
      className="approve-btn"
    >
      Approve
    </button>
    <button
      className="reject-btn"
      onClick={() => handleDeleteUser(user.id)}
    >
      Remove
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
      )}

      {/* User Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>✕</button>
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
                      {getUserTypeIcon(selectedUser.type)} {getUserTypeLabel(selectedUser.type)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{getStatusBadge(selectedUser.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Registration Date:</span>
                    <span className="detail-value">{formatDate(selectedUser.registrationDate)}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedUser.address}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedUser.description}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
