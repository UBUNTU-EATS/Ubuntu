import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/ActveDonations.css";

const ActiveDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [messages, setMessages] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [claimerData, setClaimerData] = useState(null);
  const [loadingClaimer, setLoadingClaimer] = useState(false);

  // Firebase Functions base URL
  const FUNCTIONS_BASE_URL =
    "https://us-central1-ubuntu-eats.cloudfunctions.net";

  // Helper function to get auth token
  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    return await user.getIdToken();
  };

  // Helper function to make authenticated HTTP requests
  const makeAuthenticatedRequest = async (endpoint, data = null) => {
    const token = await getAuthToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  };

  // Fetch claimer user data
  const fetchClaimerData = async (claimedByEmail, claimedBy) => {
    try {
      setLoadingClaimer(true);
      const result = await makeAuthenticatedRequest("getUserData", {
        userEmail: claimedByEmail,
        userId: claimedBy,
      });

      if (result.success) {
        setClaimerData(result.user);
      }
    } catch (error) {
      console.error("Error fetching claimer data:", error);
    } finally {
      setLoadingClaimer(false);
    }
  };

  // Open chat modal
  const openChatModal = async (donation) => {
    setChatModal({ open: true, donation });
    setMessages([]); // Clear previous messages

    if (donation.claimedByEmail || donation.claimedBy) {
      fetchClaimerData(donation.claimedByEmail, donation.claimedBy);

      // Create/get chat room
      try {
        const result = await makeAuthenticatedRequest("createChatRoom", {
          donorEmail: auth.currentUser.email,
          ngoEmail: donation.claimedByEmail,
          donationId: donation.listingID,
        });

        if (result.success) {
          setChatRoomId(result.chatRoomId);
          // Set up real-time message listener
          setupMessageListener(result.chatRoomId);
        }
      } catch (error) {
        console.error("Error setting up chat:", error);
      }
    }
  };

  const closeChatModal = () => {
    // Clean up message listener
    if (chatModal.unsubscribe) {
      chatModal.unsubscribe();
    }

    setChatModal({ open: false, donation: null });
    setClaimerData(null);
    setMessages([]);
    setChatRoomId(null);
    setNewMessage("");
  };

  const setupMessageListener = (roomId) => {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setMessages(messagesList);
    });

    // Store unsubscribe function to clean up later
    setChatModal((prev) => ({ ...prev, unsubscribe }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !chatRoomId) return;

    setSendingMessage(true);
    try {
      // Get user data for sender info
      const user = auth.currentUser;
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      await makeAuthenticatedRequest("sendMessage", {
        chatRoomId,
        message: newMessage.trim(),
        senderName: userData.name || user.displayName || "User",
        senderRole: userData.role || "donor",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Fetch donor's donations
  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await makeAuthenticatedRequest("getDonorDonations", {
        limit: 100,
      });

      if (result.success) {
        const transformedDonations = result.donations.map((donation) => ({
          id: donation.id,
          listingID: donation.listingID,
          foodType: donation.foodType,
          category: donation.typeOfFood,
          quantity: `${donation.quantity} ${donation.unit}`,
          description: donation.listingDescription,
          expiryDate: donation.expiryDate,
          scheduledTime: donation.collectBy,
          location: donation.address,
          contactPerson: donation.contactPerson,
          contactPhone: donation.contactPhone,
          specialInstructions: donation.specialInstructions,
          status: mapDatabaseStatusToDisplay(donation.listingStatus),
          dateListed: donation.dateListed,
          forFarmers: donation.forFarmers,
          imageURL: donation.imageURL,
          donorEmail: donation.donorEmail,
          coordinates: donation.coordinates,
          claimedAt: donation.claimedAt,
          claimedBy: donation.claimedBy,
          claimedByEmail: donation.claimedByEmail,
        }));

        setDonations(transformedDonations);
      } else {
        throw new Error(result.message || "Failed to fetch donations");
      }
    } catch (error) {
      console.error("Error fetching my donations:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Map database status to display status
  const mapDatabaseStatusToDisplay = (dbStatus) => {
    const statusMap = {
      UNCLAIMED: "Available",
      PENDING_PICKUP: "Available",
      CLAIMED: "Claimed",
      IN_TRANSIT: "Collected",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return statusMap[dbStatus] || dbStatus;
  };

  // Map display status to database status
  const mapDisplayStatusToDatabase = (displayStatus) => {
    const statusMap = {
      Available: "UNCLAIMED",
      Claimed: "CLAIMED",
      Collected: "IN_TRANSIT",
      Completed: "COMPLETED",
      Cancelled: "CANCELLED",
    };
    return statusMap[displayStatus] || displayStatus;
  };

  // Update donation status
  const updateStatus = async (donationId, newStatus) => {
    try {
      setUpdating(donationId);

      const dbStatus = mapDisplayStatusToDatabase(newStatus);

      const result = await makeAuthenticatedRequest("updateDonationStatus", {
        listingID: donationId,
        status: dbStatus,
      });

      if (result.success) {
        setDonations((prev) =>
          prev.map((donation) =>
            donation.id === donationId || donation.listingID === donationId
              ? { ...donation, status: newStatus }
              : donation
          )
        );
      } else {
        throw new Error(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // Filter donations
  const filteredDonations = donations.filter((donation) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return donation.status === "Available";
    if (statusFilter === "claimed") return donation.status === "Claimed";
    return false;
  });

  // Get status configuration
  const getStatusConfig = (status) => {
    const configs = {
      Available: {
        color: "#10b981",
        bg: "#d1fae5",
        icon: "🟢",
        pulse: true,
      },
      Claimed: {
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "🔔",
        pulse: true,
      },
      Collected: {
        color: "#3b82f6",
        bg: "#dbeafe",
        icon: "📦",
        pulse: false,
      },
      Completed: {
        color: "#059669",
        bg: "#a7f3d0",
        icon: "✅",
        pulse: false,
      },
      Cancelled: {
        color: "#ef4444",
        bg: "#fecaca",
        icon: "❌",
        pulse: false,
      },
    };
    return configs[status] || configs["Available"];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  if (loading) {
    return (
      <div className="modern-donations">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your donations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-donations">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load donations</h3>
          <p>{error}</p>
          <button onClick={fetchMyDonations} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-donations">
      {/* Controls Section */}
      <div className="donations-controls">
        <div className="filter-section">
          <div className="filter-pills">
            {[
              { key: "all", label: "All", count: donations.length },
              {
                key: "active",
                label: "Active",
                count: donations.filter((d) => d.status === "Available").length,
              },
              {
                key: "claimed",
                label: "Claimed",
                count: donations.filter((d) => d.status === "Claimed").length,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                className={`filter-pill ${
                  statusFilter === filter.key ? "active" : ""
                }`}
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
                <span className="pill-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="view-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <span className="view-icon">▦</span>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>

          <button onClick={fetchMyDonations} className="refresh-button">
            <span className="refresh-icon">↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Donations Section */}
      {filteredDonations.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">🍽️</div>
          <h3>No donations found</h3>
          <p>
            {statusFilter === "all"
              ? "Start making a difference by donating food to those in need"
              : `No ${statusFilter} donations at the moment`}
          </p>
        </div>
      ) : (
        <div
          className={`donations-grid ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {filteredDonations.map((donation) => {
            const statusConfig = getStatusConfig(donation.status);

            return (
              <div key={donation.id} className="donation-item">
                {/* Image Section */}
                {donation.imageURL && (
                  <div className="item-image">
                    <img src={donation.imageURL} alt={donation.foodType} />
                    <div className="image-overlay">
                      <button
                        className="view-button"
                        onClick={() => setSelectedDonation(donation)}
                      >
                        👁️ View
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="item-content">
                  <div className="content-header">
                    <div className="item-title">
                      <h3>{donation.foodType}</h3>
                      <span className="item-quantity">{donation.quantity}</span>
                    </div>

                    <div className="item-status">
                      <span
                        className={`status-dot ${
                          statusConfig.pulse ? "pulse" : ""
                        }`}
                        style={{ backgroundColor: statusConfig.color }}
                      ></span>
                      <span
                        className="status-text"
                        style={{ color: statusConfig.color }}
                      >
                        {donation.status}
                      </span>
                    </div>
                  </div>

                  <div className="content-details">
                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">{donation.location}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Listed {getTimeAgo(donation.dateListed)}
                      </span>
                    </div>

                    {donation.scheduledTime && (
                      <div className="detail-row">
                        <span className="detail-icon">⏰</span>
                        <span className="detail-text">
                          Pickup by {formatDate(donation.scheduledTime)}
                        </span>
                      </div>
                    )}

                    {donation.forFarmers && (
                      <div className="detail-row">
                        <span className="farmer-tag">🌾 Farmer Suitable</span>
                      </div>
                    )}
                  </div>

                  {/* Action Section */}
                  <div className="item-actions">
                    {donation.status === "Available" && (
                      <>
                        <button
                          className="action-button secondary"
                          onClick={() =>
                            updateStatus(donation.listingID, "Cancelled")
                          }
                          disabled={updating === donation.listingID}
                        >
                          {updating === donation.listingID ? "..." : "Cancel"}
                        </button>
                      </>
                    )}

                    {donation.status === "Claimed" && (
                      <div className="claimed-info">
                        <span className="claimed-text">
                          🔔 Claimed by {donation.claimedByEmail || "Unknown"}
                        </span>
                      </div>
                    )}

                    <button
                      className="action-button outline"
                      onClick={() => setSelectedDonation(donation)}
                    >
                      Details
                    </button>

                    {donation.status === "Claimed" && (
                      <button
                        className="action-button chat"
                        onClick={() => openChatModal(donation)}
                      >
                        💬 Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedDonation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDonation(null)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDonation.foodType}</h2>
              <button
                className="close-button"
                onClick={() => setSelectedDonation(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedDonation.imageURL && (
                <div className="modal-image">
                  <img
                    src={selectedDonation.imageURL}
                    alt={selectedDonation.foodType}
                  />
                </div>
              )}

              <div className="modal-details">
                <div className="detail-section">
                  <h4>Donation Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Quantity:</strong>
                      <span>{selectedDonation.quantity}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>{selectedDonation.category}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Status:</strong>
                      <span
                        style={{
                          color: getStatusConfig(selectedDonation.status).color,
                        }}
                      >
                        {selectedDonation.status}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Listed:</strong>
                      <span>{formatDate(selectedDonation.dateListed)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Pickup Details</h4>
                  <div className="detail-grid">
                    <div className="grid-item full-width">
                      <strong>Location:</strong>
                      <span>{selectedDonation.location}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact:</strong>
                      <span>{selectedDonation.contactPerson}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Phone:</strong>
                      <span>{selectedDonation.contactPhone}</span>
                    </div>
                    {selectedDonation.scheduledTime && (
                      <div className="grid-item full-width">
                        <strong>Pickup By:</strong>
                        <span>
                          {formatDate(selectedDonation.scheduledTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDonation.description && (
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p className="description-text">
                      {selectedDonation.description}
                    </p>
                  </div>
                )}

                {selectedDonation.specialInstructions && (
                  <div className="detail-section">
                    <h4>Special Instructions</h4>
                    <p className="instruction-text">
                      {selectedDonation.specialInstructions}
                    </p>
                  </div>
                )}

                {selectedDonation.status === "Claimed" && (
                  <div className="detail-section">
                    <h4>Claim Information</h4>
                    <div className="detail-grid">
                      <div className="grid-item">
                        <strong>Claimed By:</strong>
                        <span>{selectedDonation.claimedByEmail}</span>
                      </div>
                      <div className="grid-item">
                        <strong>Claimed At:</strong>
                        <span>{formatDate(selectedDonation.claimedAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button secondary"
                onClick={() => setSelectedDonation(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {chatModal.open && (
        <div className="modal-backdrop" onClick={closeChatModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-title">
                <h3>💬 Chat - {chatModal.donation?.foodType}</h3>
                <p>
                  {loadingClaimer
                    ? "Loading..."
                    : claimerData
                    ? `With ${claimerData.name}`
                    : "Communicate with recipient"}
                </p>
              </div>
              <button className="close-button" onClick={closeChatModal}>
                ✕
              </button>
            </div>

            <div className="chat-body">
              {claimerData && (
                <div className="claimer-info">
                  <div className="claimer-avatar">
                    {claimerData.role === "ngo" ? "🏢" : "👤"}
                  </div>
                  <div className="claimer-details">
                    <h4>{claimerData.name}</h4>
                    <p>{claimerData.role.toUpperCase()}</p>
                    <p>📧 {claimerData.email}</p>
                    <p>📞 {claimerData.phone}</p>
                    {claimerData.address && <p>📍 {claimerData.address}</p>}
                  </div>
                </div>
              )}

              {/* Replace the chat-placeholder div with this */}
              <div className="chat-messages-container">
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <div className="no-messages-icon">💬</div>
                      <p>Start a conversation with {claimerData?.name}</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${
                          message.senderEmail === auth.currentUser?.email
                            ? "own-message"
                            : "other-message"
                        }`}
                      >
                        <div className="message-content">
                          <p>{message.text}</p>
                          <span className="message-time">
                            {message.timestamp
                              ?.toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="message-input-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDonations;
