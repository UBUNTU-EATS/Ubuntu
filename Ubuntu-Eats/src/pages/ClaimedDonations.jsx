import React, { useState } from "react";
import "../styles/ClaimedDonations.css";
import { auth } from "../../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const ClaimedDonations = ({
  donations,
  onSetCollectionMethod,
  onConfirmCollection,
  onCancelClaim,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [processing, setProcessing] = useState(null);
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [donorData, setDonorData] = useState(null);
  const [loadingDonor, setLoadingDonor] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const filteredDonations = donations.filter((donation) => {
    if (activeFilter === "all") return true;
    return donation.status === activeFilter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CLAIMED":
        return "status-claimed";
      case "COLLECTED":
        return "status-collected";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-claimed";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Fresh Meals":
        return "🍽️";
      case "Baked Goods":
        return "🥐";
      case "Fruits & Vegetables":
        return "🥦";
      case "Dairy Products":
        return "🥛";
      case "Packaged Food":
        return "📦";
      case "Beverages":
        return "🥤";
      default:
        return "📦";
    }
  };

  const handleSetCollectionMethod = async (claimId, method) => {
    setProcessing(claimId);
    try {
      await onSetCollectionMethod(claimId, method);
    } catch (error) {
      console.error("Error setting collection method:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmCollection = async (claimId, listingId) => {
    setProcessing(claimId);
    try {
      await onConfirmCollection(claimId, listingId);
    } catch (error) {
      console.error("Error confirming collection:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelClaim = async (claimId, listingId) => {
    setProcessing(claimId);
    try {
      await onCancelClaim(claimId, listingId);
    } catch (error) {
      console.error("Error canceling claim:", error);
    } finally {
      setProcessing(null);
    }
  };

  // Firebase Functions base URL
  const FUNCTIONS_BASE_URL =
    "https://us-central1-ubuntu-eats.cloudfunctions.net";

  // Helper function to make authenticated HTTP requests
  const makeAuthenticatedRequest = async (endpoint, data = null) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();
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

  // Fetch donor data
  const fetchDonorData = async (donorEmail) => {
    try {
      setLoadingDonor(true);
      const result = await makeAuthenticatedRequest("getUserData", {
        userEmail: donorEmail,
      });
      if (result.success) {
        setDonorData(result.user);
      }
    } catch (error) {
      console.error("Error fetching donor data:", error);
    } finally {
      setLoadingDonor(false);
    }
  };

  // Open chat modal
  const openChatModal = async (donation) => {
    setChatModal({ open: true, donation });
    setMessages([]);

    // Use donorEmail from the donation data
    const donorEmail = donation.donorEmail || donation.listingCompany; // fallback

    if (donorEmail) {
      fetchDonorData(donorEmail);

      try {
        const result = await makeAuthenticatedRequest("createChatRoom", {
          donorEmail: donorEmail,
          ngoEmail: auth.currentUser.email,
          donationId: donation.listingId || donation.id,
        });

        if (result.success) {
          setChatRoomId(result.chatRoomId);
          setupMessageListener(result.chatRoomId);
        }
      } catch (error) {
        console.error("Error setting up chat:", error);
      }
    }
  };

  // Close chat modal
  const closeChatModal = () => {
    if (chatModal.unsubscribe) {
      chatModal.unsubscribe();
    }
    setChatModal({ open: false, donation: null });
    setDonorData(null);
    setMessages([]);
    setChatRoomId(null);
    setNewMessage("");
  };

  // Setup message listener
  const setupMessageListener = (roomId) => {
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesList);
    });

    setChatModal((prev) => ({ ...prev, unsubscribe }));
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !chatRoomId) return;

    setSendingMessage(true);
    try {
      const user = auth.currentUser;
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      await makeAuthenticatedRequest("sendMessage", {
        chatRoomId,
        message: newMessage.trim(),
        senderName: userData.name || user.displayName || "NGO User",
        senderRole: userData.role || "ngo",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="claimed-donations">
      <div className="section-header">
        <h2>My Claimed Donations</h2>
        <p>Manage your claimed food donations and collection process</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Claims ({donations.length})
        </button>
        <button
          className={`filter-tab ${activeFilter === "CLAIMED" ? "active" : ""}`}
          onClick={() => setActiveFilter("CLAIMED")}
        >
          To Collect ({donations.filter((d) => d.status === "CLAIMED").length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "COLLECTED" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("COLLECTED")}
        >
          Collected ({donations.filter((d) => d.status === "COLLECTED").length})
        </button>
      </div>

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No claimed donations</h3>
          <p>
            You haven't claimed any donations yet. Browse available donations to
            get started.
          </p>
        </div>
      ) : (
        <div className="claimed-list">
          {filteredDonations.map((donation) => (
            <div key={donation.claimId} className="claimed-card">
              <div className="card-header">
                <div className="donor-info">
                  <h3>{donation.listingCompany || donation.donorName}</h3>
                  <span className="claim-date">
                    Claimed on {formatDate(donation.claimDate)}
                  </span>
                </div>
                <div className="status-section">
                  <span
                    className={`status-badge ${getStatusColor(
                      donation.status
                    )}`}
                  >
                    {donation.status.charAt(0).toUpperCase() +
                      donation.status.slice(1).toLowerCase()}
                  </span>
                  <div className="category-badge">
                    {getCategoryIcon(donation.typeOfFood)}
                    {donation.typeOfFood}
                  </div>
                </div>
              </div>

              <div className="card-content">
                <div className="food-details">
                  <h4>{donation.foodType}</h4>
                  <p className="quantity">
                    {donation.quantity} {donation.unit}
                  </p>
                </div>

                {donation.imageURL && (
                  <div className="claimed-image">
                    <img src={donation.imageURL} alt={donation.foodType} />
                  </div>
                )}

                <div className="donation-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(donation.collectBy)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Location:</span>
                    <span className="meta-value">
                      {donation.address || donation.location}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📞 Contact:</span>
                    <span className="meta-value">
                      {donation.contactPerson} - {donation.contactPhone}
                    </span>
                  </div>
                  {donation.specialInstructions && (
                    <div className="meta-item">
                      <span className="meta-label">⚠️ Instructions:</span>
                      <span className="meta-value">
                        {donation.specialInstructions}
                      </span>
                    </div>
                  )}
                </div>

                {donation.status === "CLAIMED" && (
                  <div className="collection-method">
                    <h4>Collection Method</h4>
                    <div className="method-options">
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "self" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleSetCollectionMethod(donation.claimId, "self")
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Processing..."
                          : "🚗 Self Collection"}
                      </button>
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "volunteer"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSetCollectionMethod(
                            donation.claimId,
                            "volunteer"
                          )
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Processing..."
                          : "🤝 Volunteer Assistance"}
                      </button>
                    </div>
                  </div>
                )}

                {donation.collectionMethod === "volunteer" &&
                  donation.status === "CLAIMED" && (
                    <div className="volunteer-info">
                      <div className="volunteer-assigned">
                        <span className="waiting-text">
                          ⏳ Waiting for volunteer assignment...
                        </span>
                      </div>
                    </div>
                  )}

                {donation.collectionMethod === "self" &&
                  donation.status === "CLAIMED" && (
                    <div className="collection-instructions">
                      <p>
                        Please collect the donation at the scheduled time. Don't
                        forget to confirm collection when you receive it.
                      </p>
                    </div>
                  )}
              </div>

              <div className="card-actions">
                {donation.status === "CLAIMED" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() =>
                        handleCancelClaim(donation.claimId, donation.id)
                      }
                      disabled={processing === donation.claimId}
                    >
                      {processing === donation.claimId
                        ? "Canceling..."
                        : "Cancel Claim"}
                    </button>
                    {donation.collectionMethod === "self" && (
                      <button
                        className="action-btn primary"
                        onClick={() =>
                          handleConfirmCollection(donation.claimId, donation.id)
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Confirming..."
                          : "Confirm Collection"}
                      </button>
                    )}

                    {donation.status === "CLAIMED" && (
                      <>
                        {/* ADD THIS CHAT BUTTON */}
                        <button
                          className="action-btn chat-btn"
                          onClick={() => openChatModal(donation)}
                        >
                          💬 Chat with Donor
                        </button>
                      </>
                    )}
                  </>
                )}

                {donation.status === "COLLECTED" && (
                  <div className="completion-info">
                    <span className="completed-text">
                      ✅ Successfully collected!
                    </span>
                    <span className="completion-date">
                      Collected on {formatDate(donation.collectedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {chatModal.open && (
        <div className="modal-overlay" onClick={closeChatModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-title">
                <h3>💬 Chat with Donor</h3>
                <p>
                  {loadingDonor
                    ? "Loading..."
                    : donorData
                    ? `${donorData.name}`
                    : "Donor"}
                </p>
              </div>
              <button className="close-btn" onClick={closeChatModal}>
                ✕
              </button>
            </div>

            <div className="chat-body">
              {donorData && (
                <div className="donor-info">
                  <div className="donor-avatar">👤</div>
                  <div className="donor-details">
                    <h4>{donorData.name}</h4>
                    <p>DONOR</p>
                    <p>📧 {donorData.email}</p>
                    <p>📞 {donorData.phone}</p>
                  </div>
                </div>
              )}

              <div className="chat-messages-container">
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <div className="no-messages-icon">💬</div>
                      <p>Start a conversation about this donation</p>
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

export default ClaimedDonations;
