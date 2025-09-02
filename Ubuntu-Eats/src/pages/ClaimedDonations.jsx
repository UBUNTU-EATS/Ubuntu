import React, { useState, Fragment } from "react";
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
  const [messageCache, setMessageCache] = useState(new Map()); // Cache messages by chatRoomId
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userCache, setUserCache] = useState(new Map()); // Cache user data by email

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


  // User cache management functions
const getCachedUser = (userEmail) => {
  return userCache.get(userEmail) || null;
};

const setCachedUser = (userEmail, userData) => {
  setUserCache(prev => new Map(prev).set(userEmail, userData));
};

  // Fetch donor data

  const fetchDonorData = async (donorEmail) => {
  if (!donorEmail) return;
  
  // Check cache first - instant load
  const cachedUser = getCachedUser(donorEmail);
  if (cachedUser) {
    setDonorData(cachedUser);
    setLoadingDonor(false);
    console.log('Loaded donor data from cache:', cachedUser.name);
  } else {
    setLoadingDonor(true);
  }

  try {
    // Always fetch fresh data in background to keep cache updated
    const result = await makeAuthenticatedRequest("getUserData", {
      userEmail: donorEmail,
    });

    if (result.success) {
      // Update cache with fresh data
      setCachedUser(donorEmail, result.user);
      setDonorData(result.user);
      
      if (!cachedUser) {
        console.log('Loaded fresh donor data:', result.user.name);
      }
    }
  } catch (error) {
    console.error("Error fetching donor data:", error);
    // If we have cached data and fresh fetch fails, keep using cached data
    if (!cachedUser) {
      setDonorData(null);
    }
  } finally {
    setLoadingDonor(false);
  }
};


//  message date formating functions


// Helper functions for date formatting
const formatMessageDate = (timestamp) => {
  if (!timestamp) return null;
  
  let date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return null;
  }
  
  return date;
};

const getDateString = (date) => {
  if (!date) return '';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare just dates
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (messageDate.getTime() === todayDate.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === yesterdayDate.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true; // Always show for first message
  
  const currentDate = formatMessageDate(currentMessage.timestamp);
  const previousDate = formatMessageDate(previousMessage.timestamp);
  
  if (!currentDate || !previousDate) return false;
  
  // Compare dates (ignoring time)
  const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const previousDay = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
  
  return currentDay.getTime() !== previousDay.getTime();
};




  
  // Cache management functions
  const getCachedMessages = (chatRoomId) => {
    return messageCache.get(chatRoomId) || [];
  };

  const setCachedMessages = (chatRoomId, messages) => {
    setMessageCache((prev) => new Map(prev).set(chatRoomId, messages));
  };

  const addMessageToCache = (chatRoomId, message) => {
    setMessageCache((prev) => {
      const newCache = new Map(prev);
      const existingMessages = newCache.get(chatRoomId) || [];
      const updatedMessages = [...existingMessages, message];
      newCache.set(chatRoomId, updatedMessages);
      return newCache;
    });
  };

  // Open chat modal

  const openChatModal = async (donation) => {
  setChatModal({ open: true, donation });

  // Use the correct donor email field - it should be donorEmail, not claimedByEmail
  const donorEmail = donation.donorEmail || donation.listingCompany; 
  const ngoEmail = auth.currentUser.email;
  const donationId = donation.listingID || donation.id;
  
  const calculatedChatRoomId = `${donorEmail.replace("@", "_")}_${ngoEmail.replace("@", "_")}_${donationId}`;

  // Load cached messages immediately for instant display
  const cachedMessages = getCachedMessages(calculatedChatRoomId);
  setMessages(cachedMessages);
  setChatRoomId(calculatedChatRoomId);

  // Load cached user data immediately if available
  const cachedUser = getCachedUser(donorEmail);
  if (cachedUser) {
    setDonorData(cachedUser);
    setLoadingDonor(false);
  } else {
    setLoadingDonor(true);
  }

  if (donorEmail) {
    // Start fetching user data (will use cache if available)
    fetchDonorData(donorEmail);

    // Set up real-time listener immediately
    setupMessageListener(calculatedChatRoomId);

    // Create/get chat room in background
    try {
      const result = await makeAuthenticatedRequest("createChatRoom", {
        donorEmail: donorEmail,
        ngoEmail: auth.currentUser.email,
        donationId: donationId,
      });

      if (result.success && result.chatRoomId !== calculatedChatRoomId) {
        // If server returns different chatRoomId, update accordingly
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
      const firebaseMessages = [];
      snapshot.forEach((doc) => {
        firebaseMessages.push({
          id: doc.id,
          ...doc.data(),
          isOptimistic: false,
        });
      });

      // Update cache with latest messages
      setCachedMessages(roomId, firebaseMessages);

      // Merge with optimistic messages and remove duplicates
      setMessages((prevMessages) => {
        const optimisticMessages = prevMessages.filter(
          (msg) =>
            msg.isOptimistic &&
            !firebaseMessages.some((fbMsg) => {
              const isSameMessage =
                fbMsg.text === msg.text &&
                fbMsg.senderEmail === msg.senderEmail;

              if (!isSameMessage) return false;

              const fbTime = fbMsg.timestamp?.toDate
                ? fbMsg.timestamp.toDate().getTime()
                : fbMsg.timestamp?.seconds
                ? fbMsg.timestamp.seconds * 1000
                : 0;
              const optTime =
                typeof msg.timestamp === "number"
                  ? msg.timestamp
                  : msg.timestamp?.seconds
                  ? msg.timestamp.seconds * 1000
                  : 0;

              return Math.abs(fbTime - optTime) < 5000;
            })
        );

        const allMessages = [...firebaseMessages, ...optimisticMessages];
        return allMessages.sort((a, b) => {
          const getTimestampValue = (ts) => {
            if (!ts) return 0;
            if (ts?.toDate && typeof ts.toDate === "function") {
              return ts.toDate().getTime();
            }
            if (ts?.seconds) {
              return ts.seconds * 1000;
            }
            if (typeof ts === "number") {
              return ts;
            }
            return 0;
          };

          const aTime = getTimestampValue(a.timestamp);
          const bTime = getTimestampValue(b.timestamp);
          return aTime - bTime;
        });
      });
    });

    setChatModal((prev) => ({ ...prev, unsubscribe }));
  };

  // Send message


  const sendMessage = async () => {
  if (!newMessage.trim() || sendingMessage || !chatRoomId) return;

  const messageText = newMessage.trim();
  const user = auth.currentUser;
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const optimisticMessage = {
    id: tempId,
    text: messageText,
    senderEmail: user.email,
    senderName: userData.name || user.displayName || "User",
    senderRole: userData.role || "ngo", // Change from "donor" to "ngo"
    timestamp: Date.now(),
    read: false,
    isOptimistic: true,
    status: "sending",
  };

  setNewMessage("");
  setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
  addMessageToCache(chatRoomId, optimisticMessage);
  setSendingMessage(true);

  try {
    await makeAuthenticatedRequest("sendMessage", {
      chatRoomId,
      message: messageText,
      senderName: userData.name || user.displayName || "User",
      senderRole: userData.role || "ngo", // Change from "donor" to "ngo"
    });

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === tempId
          ? { ...msg, status: "sent", isOptimistic: true }
          : msg
      )
    );
  } catch (error) {
    console.error("Error sending message:", error);

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === tempId
          ? { ...msg, status: "failed", isOptimistic: true }
          : msg
      )
    );

    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== tempId)
      );
    }, 5000);
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
  messages.map((message, index) => {
    const isOwn = message.senderEmail === auth.currentUser?.email;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
    
    // Fix timestamp handling for different formats
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "";

      // Handle Firebase Timestamp objects
      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Handle optimistic timestamps (plain seconds)
      if (timestamp?.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Handle plain number timestamps
      if (typeof timestamp === "number") {
        return new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return "";
    };

    return (
      <React.Fragment key={message.id}>
        {/* Date Separator */}
        {showDateSeparator && (
          <div className="date-separator">
            <div className="date-separator-line"></div>
            <span className="date-separator-text">
              {getDateString(formatMessageDate(message.timestamp))}
            </span>
            <div className="date-separator-line"></div>
          </div>
        )}
        
        {/* Message */}
        <div
          className={`message ${
            isOwn ? "own-message" : "other-message"
          } ${message.isOptimistic ? "optimistic" : ""}`}
        >
          <div className="message-content">
            <p>{message.text}</p>
            <span className="message-time">
              {formatTimestamp(message.timestamp)}

              {/* Add status indicators for own messages */}
              {isOwn && message.isOptimistic && (
                <span className="message-status">
                  {message.status === "sending" && " ⏳"}
                  {message.status === "sent" && " ✓"}
                  {message.status === "failed" && " ❌"}
                </span>
              )}
            </span>
          </div>
        </div>
      </React.Fragment>
    );
  })
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
