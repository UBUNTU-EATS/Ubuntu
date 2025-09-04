// Enhanced FarmerMyDonations component with chat functionality
import React, { useState, useRef, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

const FarmerMyDonations = ({ donations }) => {
  // Chat-related state
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [claimerData, setClaimerData] = useState(null);
  const [loadingClaimer, setLoadingClaimer] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageCache, setMessageCache] = useState(new Map());
  const [userCache, setUserCache] = useState(new Map());

  const messagesEndRef = useRef(null);
  const messageListenerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (messageListenerRef.current) {
        messageListenerRef.current();
      }
    };
  }, []);

  // Chat utility functions
  const makeAuthenticatedRequest = async (endpoint, body) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();
    const functionUrl = `https://us-central1-ubuntu-eats.cloudfunctions.net/${endpoint}`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Request failed");
    }
    return result;
  };

  // Cache management functions
  const getCachedMessages = (chatRoomId) => {
    return messageCache.get(chatRoomId) || [];
  };

  const setCachedMessages = (chatRoomId, messages) => {
    setMessageCache(prev => new Map(prev.set(chatRoomId, messages)));
  };

  const addMessageToCache = (chatRoomId, message) => {
    const cached = getCachedMessages(chatRoomId);
    setCachedMessages(chatRoomId, [...cached, message]);
  };

  const getCachedUser = (email) => {
    return userCache.get(email);
  };

  const setCachedUser = (email, userData) => {
    setUserCache(prev => new Map(prev.set(email, userData)));
  };

  // Fetch claimer data
  const fetchClaimerData = async (claimerEmail) => {
    try {
      // Check cache first
      const cached = getCachedUser(claimerEmail);
      if (cached) {
        setClaimerData(cached);
        setLoadingClaimer(false);
        return;
      }

      setLoadingClaimer(true);
      const userDoc = await getDoc(doc(db, "users", claimerEmail));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setClaimerData(userData);
        setCachedUser(claimerEmail, userData);
      }
    } catch (error) {
      console.error("Error fetching claimer data:", error);
    } finally {
      setLoadingClaimer(false);
    }
  };

  // Setup message listener
  const setupMessageListener = async (chatRoomId) => {
    try {
      // Clean up existing listener
      if (messageListenerRef.current) {
        messageListenerRef.current();
      }

      const messagesRef = collection(db, "chatRooms", chatRoomId, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      messageListenerRef.current = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMessages(newMessages);
          setCachedMessages(chatRoomId, newMessages);
        },
        (error) => {
          console.error("Error listening to messages:", error);
        }
      );
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }
  };

  // Open chat modal
  const openChatModal = async (donation) => {
    setChatModal({ open: true, donation });

    // Use the correct claimer email field
    const claimerEmail = donation.claimedByEmail;
    const farmerEmail = auth.currentUser.email;
    const donationId = donation.id;

    // Create chat room ID using farmer/claimer pattern
    const calculatedChatRoomId = `${farmerEmail.replace("@", "_")}_${claimerEmail.replace("@", "_")}_${donationId}`;

    // Load cached messages immediately for instant display
    const cachedMessages = getCachedMessages(calculatedChatRoomId);
    setMessages(cachedMessages);
    setChatRoomId(calculatedChatRoomId);

    // Load cached user data immediately if available
    const cachedUser = getCachedUser(claimerEmail);
    if (cachedUser) {
      setClaimerData(cachedUser);
      setLoadingClaimer(false);
    } else {
      setLoadingClaimer(true);
    }

    if (claimerEmail) {
      // Start fetching user data (will use cache if available)
      fetchClaimerData(claimerEmail);

      // Set up real-time listener immediately
      setupMessageListener(calculatedChatRoomId);

      // Create/get chat room in background
      try {
        const result = await makeAuthenticatedRequest("createChatRoom", {
          donorEmail: farmerEmail, // Farmer is the donor in this case
          ngoEmail: claimerEmail, // The backend expects 'ngoEmail' but we're using it for claimer
          donationId: donationId,
        });

        if (result.success && result.chatRoomId !== calculatedChatRoomId) {
          // If server returns different chatRoomId, update accordingly
          setChatRoomId(result.chatRoomId);
          setupMessageListener(result.chatRoomId);
        }
      } catch (error) {
        console.error("Error creating/getting chat room:", error);
        // Continue with calculated chat room ID even if API call fails
      }
    }
  };

  // Close chat modal
  const closeChatModal = () => {
    setChatModal({ open: false, donation: null });
    setMessages([]);
    setNewMessage("");
    setClaimerData(null);
    setChatRoomId(null);
    setLoadingClaimer(false);

    // Clean up message listener
    if (messageListenerRef.current) {
      messageListenerRef.current();
      messageListenerRef.current = null;
    }
  };



  // EXACT formatMessageTime function from working components
const formatMessageTime = (timestamp) => {
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

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !chatRoomId) return;

    const messageText = newMessage.trim();
    const user = auth.currentUser;
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const optimisticMessage = {
      id: tempId,
      text: messageText,
      senderEmail: user.email,
      senderName: userData.name || user.displayName || "User",
      senderRole: userData.role || "farmer",
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
        senderRole: userData.role || "farmer",
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
            ? { ...msg, status: "error", isOptimistic: true }
            : msg
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'UNCLAIMED': return '#f59e0b';
      case 'PENDING': return '#3b82f6';
      case 'CLAIMED': return '#10b981';
      case 'COLLECTED': return '#059669';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UNCLAIMED': return '🟡';
      case 'PENDING': return '🔵';
      case 'CLAIMED': return '✅';
      case 'COLLECTED': return '🎉';
      case 'CANCELLED': return '❌';
      default: return '📦';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (donations.length === 0) {
    return (
      <div className="my-donations-container">
        <div className="donations-header">
          <h2>My Farm Donations</h2>
          <p>Track the donations you've shared with the community</p>
        </div>

        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No Donations Yet</h3>
          <p>You haven't made any donations yet.</p>
          <p>Use the "Donate Surplus" tab to share your excess produce!</p>
        </div>
      </div>
    );
  }

  // Group donations by status
  const groupedDonations = donations.reduce((groups, donation) => {
    const status = donation.listingStatus || 'UNCLAIMED';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(donation);
    return groups;
  }, {});

  const statusOrder = ['UNCLAIMED', 'PENDING', 'CLAIMED', 'COLLECTED', 'CANCELLED'];

  return (
    <div className="my-donations-container">
      <div className="donations-header">
        <h2>My Farm Donations</h2>
        <p>Track the donations you've shared with the community</p>
      </div>

      <div className="donations-summary">
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => d.listingStatus === 'UNCLAIMED').length}
          </span>
          <span className="summary-label">Available</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => ['PENDING', 'CLAIMED'].includes(d.listingStatus)).length}
          </span>
          <span className="summary-label">Claimed</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => d.listingStatus === 'COLLECTED').length}
          </span>
          <span className="summary-label">Successfully Collected</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.reduce((total, d) => total + (parseInt(d.quantity) || 0), 0)}
          </span>
          <span className="summary-label">Total Quantity Shared</span>
        </div>
      </div>

      <div className="donations-sections">
        {statusOrder.map((status) => {
          const statusDonations = groupedDonations[status] || [];
          if (statusDonations.length === 0) return null;

          return (
            <div key={status} className="donation-status-section">
              <div className="section-header">
                <h3>
                  {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()} 
                  <span className="count">({statusDonations.length})</span>
                </h3>
              </div>

              <div className="donations-grid">
                {statusDonations.map((donation) => (
                  <div key={donation.id} className="donation-card">
                    <div className="card-header">
                      <h4>{donation.foodType}</h4>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(donation.listingStatus) }}
                      >
                        {getStatusIcon(donation.listingStatus)} {donation.listingStatus}
                      </span>
                    </div>

                    <div className="card-details">
                      <div className="detail-row">
                        <span className="detail-label">📦 Quantity:</span>
                        <span className="detail-value">{donation.quantity}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📅 Expires:</span>
                        <span className="detail-value">{formatDate(donation.expiryDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📍 Location:</span>
                        <span className="detail-value">{donation.location}</span>
                      </div>
                      {donation.claimedByEmail && (
                        <div className="detail-row">
                          <span className="detail-label">👤 Claimed by:</span>
                          <span className="detail-value">{donation.claimedByEmail}</span>
                        </div>
                      )}
                      {donation.claimedAt && (
                        <div className="detail-row">
                          <span className="detail-label">⏰ Claimed at:</span>
                          <span className="detail-value">{formatDate(donation.claimedAt)}</span>
                        </div>
                      )}
                      {donation.specialInstructions && (
                        <div className="detail-row">
                          <span className="detail-label">📝 Instructions:</span>
                          <span className="detail-value">{donation.specialInstructions}</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Button - Show when claimed or collected */}
                    {(donation.listingStatus === 'CLAIMED' || donation.listingStatus === 'COLLECTED') && donation.claimedByEmail && (
                      <div className="card-actions">
                        <button 
                          className="action-btn chat-btn"
                          onClick={() => openChatModal(donation)}
                        >
                          💬 Chat with Recipient
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Modal */}
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
                    {claimerData.role === "ngo" ? "🏢" : claimerData.role === "farmer" ? "🚜" : "👤"}
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

              <div className="chat-messages-container">
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${
                          message.senderEmail === auth.currentUser?.email
                            ? "sent"
                            : "received"
                        }`}
                      >
                        <div className="message-content">
                          <p>{message.text}</p>
                          <span className="message-time">
                            {formatMessageTime(message.timestamp)}
                            {message.isOptimistic && (
                              <span className={`status ${message.status}`}>
                                {message.status === "sending" && "⏳"}
                                {message.status === "sent" && "✓"}
                                {message.status === "error" && "❌"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="chat-input"
                    rows="1"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="send-button"
                  >
                    {sendingMessage ? "📤" : "➤"}
                  </button>
                </div>
                <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="donations-tips">
        <h3>📋 Donation Management Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>💬 Stay Connected</h4>
            <p>Use the chat feature to communicate with recipients about pickup details, special instructions, and any changes.</p>
          </div>
          <div className="tip-card">
            <h4>⏰ Monitor Claims</h4>
            <p>Keep track of your claimed donations to ensure timely pickup and successful food redistribution.</p>
          </div>
          <div className="tip-card">
            <h4>🤝 Build Relationships</h4>
            <p>Regular communication with NGOs and volunteers helps build lasting partnerships for future donations.</p>
          </div>
          <div className="tip-card">
            <h4>📊 Track Impact</h4>
            <p>Monitor your successful collections to see the positive impact your donations are making in the community.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerMyDonations;