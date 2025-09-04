// Enhanced FarmerMyClaims.jsx with Chat Feature
import React, { useState, useRef, useEffect } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import "../styles/FarmerDashboard.css";

const FarmerMyClaims = ({ claims, onSetCollectionMethod, onConfirmCollection, onCancelClaim }) => {
  // Chat-related state
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [donorData, setDonorData] = useState(null);
  const [loadingDonor, setLoadingDonor] = useState(false);
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

  const getCachedUser = (email) => {
    return userCache.get(email);
  };

  const setCachedUser = (email, userData) => {
    setUserCache((prev) => new Map(prev).set(email, userData));
  };

  // Fetch donor data with caching
  const fetchDonorData = async (donorEmail) => {
    try {
      // Check cache first
      const cachedUser = getCachedUser(donorEmail);
      if (cachedUser) {
        setDonorData(cachedUser);
        setLoadingDonor(false);
        return cachedUser;
      }

      setLoadingDonor(true);
      const userDoc = await getDoc(doc(db, "users", donorEmail));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCachedUser(donorEmail, userData);
        setDonorData(userData);
        setLoadingDonor(false);
        return userData;
      } else {
        // Fallback for donors who might not be in users collection
        const fallbackData = { 
          name: donorEmail.split('@')[0], 
          email: donorEmail,
          phone: "Not available",
          role: "donor"
        };
        setCachedUser(donorEmail, fallbackData);
        setDonorData(fallbackData);
        setLoadingDonor(false);
        return fallbackData;
      }
    } catch (error) {
      console.error("Error fetching donor data:", error);
      const fallbackData = { 
        name: "Donor", 
        email: donorEmail,
        phone: "Not available",
        role: "donor"
      };
      setDonorData(fallbackData);
      setLoadingDonor(false);
      return fallbackData;
    }
  };

  // Set up message listener
  const setupMessageListener = (chatRoomId) => {
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

    // Use the correct donor email field
    const donorEmail = donation.donorEmail || donation.listingCompany;
    const farmerEmail = auth.currentUser.email;
    const donationId = donation.listingID || donation.id;

    // Create chat room ID using farmer/donor pattern
    const calculatedChatRoomId = `${donorEmail.replace("@", "_")}_${farmerEmail.replace("@", "_")}_${donationId}`;

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
          ngoEmail: farmerEmail, // The backend expects 'ngoEmail' but we're using it for farmer
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
    setDonorData(null);
    setChatRoomId(null);
    setLoadingDonor(false);

    // Clean up message listener
    if (messageListenerRef.current) {
      messageListenerRef.current();
      messageListenerRef.current = null;
    }
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


  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format date/time for messages
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    } catch (error) {
      return null;
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = formatMessageDate(currentMessage.timestamp);
    const previousDate = formatMessageDate(previousMessage.timestamp);

    if (!currentDate || !previousDate) return false;

    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const previousDay = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());

    return currentDay.getTime() !== previousDay.getTime();
  };

  // Utility functions from original component
  const formatDate = (timestamp) => {
    if (!timestamp) return "Not available";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getTimeUntilPickup = (collectBy) => {
    if (!collectBy) return "No deadline";
    
    const now = new Date();
    const deadline = collectBy.toDate ? collectBy.toDate() : new Date(collectBy);
    const diffTime = deadline - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffTime < 0) return "⚠️ Overdue";
    if (diffHours < 1) return "🚨 Less than 1 hour left";
    if (diffHours < 24) return `⏰ ${diffHours} hours left`;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `📅 ${diffDays} days left`;
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📦";
    const cat = category.toLowerCase();
    if (cat.includes("vegetables") || cat.includes("produce")) return "🥕";
    if (cat.includes("fruits")) return "🍎";
    if (cat.includes("dairy")) return "🥛";
    if (cat.includes("bakery") || cat.includes("bread")) return "🍞";
    if (cat.includes("meat")) return "🥩";
    if (cat.includes("expired")) return "♻️";
    return "📦";
  };

  // Group claims by status
  const groupedClaims = claims.reduce((groups, claim) => {
    const status = claim.status || 'pending';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(claim);
    return groups;
  }, {});

  const statusOrder = ['CLAIMED', 'PENDING', 'COLLECTED', 'CANCELLED'];

  return (
    <div className="my-claims-container">
      <div className="claims-header">
        <h2>My Food Claims</h2>
        <p>Track your claimed food donations and pickup schedule</p>
      </div>

      {claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Claims Yet</h3>
          <p>You haven't claimed any food donations yet.</p>
          <p>Visit the "Available Donations" tab to start claiming food!</p>
        </div>
      ) : (
        <>
          <div className="claims-summary">
            <div className="summary-card">
              <span className="summary-number">
                {claims.filter(c => c.status === 'CLAIMED' || c.status === 'PENDING').length}
              </span>
              <span className="summary-label">Active Claims</span>
            </div>
            <div className="summary-card">
              <span className="summary-number">
                {claims.filter(c => c.status === 'COLLECTED').length}
              </span>
              <span className="summary-label">Successfully Collected</span>
            </div>
            <div className="summary-card">
              <span className="summary-number">
                {claims.filter(c => c.status === 'CANCELLED').length}
              </span>
              <span className="summary-label">Cancelled Claims</span>
            </div>
          </div>

          <div className="claims-sections">
            {statusOrder.map((status) => {
              const statusClaims = groupedClaims[status];
              if (!statusClaims || statusClaims.length === 0) return null;

              const getStatusTitle = (status) => {
                switch (status) {
                  case 'CLAIMED': return '✅ Active Claims';
                  case 'PENDING': return '⏳ Pending Claims';  
                  case 'COLLECTED': return '🎉 Successfully Collected';
                  case 'CANCELLED': return '❌ Cancelled Claims';
                  default: return status;
                }
              };

              return (
                <div key={status} className="claims-section">
                  <h3 className="section-title">
                    {getStatusTitle(status)}
                    <span className="count">{statusClaims.length}</span>
                  </h3>

                  <div className="claims-grid">
                    {statusClaims.map((claim) => (
                      <div key={claim.claimId} className="claim-card">
                        <div className="claim-header">
                          <div className="claim-title">
                            <span className="category-icon">
                              {getCategoryIcon(claim.listingCategory)}
                            </span>
                            <div>
                              <h4>{claim.listingTitle || "Food Donation"}</h4>
                              <p className="donor-name">
                                by {claim.listingCompany || claim.donorEmail}
                              </p>
                            </div>
                          </div>
                          <div className={`claim-status ${claim.status?.toLowerCase()}`}>
                            {claim.status}
                          </div>
                        </div>

                        <div className="claim-details">
                          <div className="detail-row">
                            <span className="detail-label">📦 Quantity:</span>
                            <span className="detail-value">{claim.listingQuantity}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">📍 Location:</span>
                            <span className="detail-value">{claim.listingLocation}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">⏰ Collect By:</span>
                            <span className="detail-value pickup-time">
                              {getTimeUntilPickup(claim.collectBy)}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">📅 Claimed:</span>
                            <span className="detail-value">{formatDate(claim.claimDate)}</span>
                          </div>
                        </div>

                        {/* Chat and Action Buttons */}
                        <div className="claim-actions">
                          {(claim.status === 'CLAIMED' || claim.status === 'PENDING') && (
                            <>
                              <button 
                                className="action-btn chat-btn"
                                onClick={() => openChatModal(claim)}
                              >
                                💬 Chat with Donor
                              </button>
                              
                              {!claim.collectionMethod && (
                                <div className="collection-method-selection">
                                  <p>Choose collection method:</p>
                                  <div className="method-buttons">
                                    <button 
                                      onClick={() => onSetCollectionMethod(claim.claimId, 'self')}
                                      className="method-btn"
                                    >
                                      🚚 Self Collection
                                    </button>
                                    <button 
                                      onClick={() => onSetCollectionMethod(claim.claimId, 'volunteer')}
                                      className="method-btn"
                                    >
                                      🤝 Request Volunteer
                                    </button>
                                  </div>
                                </div>
                              )}

                              {claim.collectionMethod && claim.status === 'CLAIMED' && (
                                <div className="collection-actions">
                                  <p>Collection method: <strong>{claim.collectionMethod === 'self' ? 'Self Collection' : 'Volunteer Assistance'}</strong></p>
                                  <button 
                                    onClick={() => onConfirmCollection(claim.claimId, claim.listingID || claim.listingId)}
                                    className="confirm-btn"
                                  >
                                    ✅ Mark as Collected
                                  </button>
                                  <button 
                                    onClick={() => onCancelClaim(claim.claimId, claim.listingID || claim.listingId)}
                                    className="cancel-btn"
                                  >
                                    ❌ Cancel Claim
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {claim.status === 'COLLECTED' && (
                            <div className="success-message">
                              <span>🎉 Successfully collected!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Chat Modal */}
      {chatModal.open && (
        <div className="modal-backdrop" onClick={closeChatModal}>
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
                  <div className="donor-avatar">🏪</div>
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
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage = message.senderEmail === auth.currentUser?.email;
                      const previousMessage = index > 0 ? messages[index - 1] : null;
                      const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

                      return (
                        <React.Fragment key={message.id}>
                          {showDateSeparator && (
                            <div className="date-separator">
                              {formatMessageDate(message.timestamp)?.toDateString()}
                            </div>
                          )}
                          <div className={`message ${
                            isOwnMessage ? "own-message" : "other-message"
                          } ${message.isOptimistic ? "optimistic" : ""}`}>
                            <div className="message-content">
                              <p>{message.text}</p>
                              <span className="message-time">
                                {formatMessageTime(message.timestamp)}
                                
                                {/* ✅ FIXED: Status indicators exactly like NGO system */}
                                {isOwnMessage && message.isOptimistic && (
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
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input-container">
                  <div className="message-input-group">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="message-input"
                      rows={2}
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
        </div>
      )}

      {/* Claims Tips */}
      <div className="claims-tips">
        <h3>📋 Claim Management Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>💬 Stay Connected</h4>
            <p>Use the chat feature to communicate with donors about pickup times, special instructions, and any changes to your plans.</p>
          </div>
          <div className="tip-card">
            <h4>⏰ Timely Collection</h4>
            <p>Always collect donations before the deadline. This helps maintain trust with donors and ensures food quality.</p>
          </div>
          <div className="tip-card">
            <h4>🤝 Be Reliable</h4>
            <p>Only claim donations you can actually collect. Cancel claims early if your plans change to give others a chance.</p>
          </div>
          <div className="tip-card">
            <h4>🔄 Update Status</h4>
            <p>Mark donations as collected promptly after pickup. This helps keep the system accurate for everyone.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerMyClaims;