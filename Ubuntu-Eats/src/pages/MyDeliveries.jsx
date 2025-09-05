import React, { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import RouteMap from "./RouteMap";
import "../styles/MyDeliveries.css";

const MyDeliveries = ({
  deliveries,
  onConfirmDelivery,
  onCancelDelivery,
  onCompleteDelivery,
  onOpenChat,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [processing, setProcessing] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [userLocation, setUserLocation] = useState({
    lat: -26.2041,
    lng: 28.0473,
  }); // Default to Johannesburg

  // Chat state
  const [chatModal, setChatModal] = useState({ open: false, delivery: null });
  const [donorData, setDonorData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingDonor, setLoadingDonor] = useState(false);
  const [userCache, setUserCache] = useState(new Map());
  const [messageCache, setMessageCache] = useState(new Map());

  // Firebase Functions base URL
  const FUNCTIONS_BASE_URL = "https://us-central1-ubuntu-eats.cloudfunctions.net";

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

  // Cache management functions
  const getCachedUser = (userEmail) => {
    return userCache.get(userEmail) || null;
  };

  const setCachedUser = (userEmail, userData) => {
    setUserCache(prev => new Map(prev).set(userEmail, userData));
  };

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

  // Get user's current location (optional)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log("Location access granted - maps will show your current location");
        },
        (error) => {
          // Handle different geolocation errors gracefully
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log("Location access denied by user - using default location (Johannesburg)");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Location information unavailable - using default location");
              break;
            case error.TIMEOUT:
              console.log("Location request timed out - using default location");
              break;
            default:
              console.log("Unknown location error - using default location");
              break;
          }
          // Keep the default Johannesburg location - no need to show error to user
        },
        {
          timeout: 10000, // 10 second timeout
          enableHighAccuracy: false, // Don't require GPS for faster response
          maximumAge: 300000 // Accept cached position up to 5 minutes old
        }
      );
    } else {
      console.log("Geolocation not supported by this browser - using default location");
    }
  }, []);

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (activeFilter === "all") return true;
    return delivery.status === activeFilter;
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

  const getStatusConfig = (status) => {
    const configs = {
      ASSIGNED: {
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "🔄",
        label: "In Progress",
      },
      PICKED_UP: {
        color: "#3b82f6",
        bg: "#dbeafe",
        icon: "📦",
        label: "Picked Up",
      },
      DELIVERED: {
        color: "#059669",
        bg: "#a7f3d0",
        icon: "✅",
        label: "Delivered",
      },
      CANCELLED: {
        color: "#ef4444",
        bg: "#fecaca",
        icon: "❌",
        label: "Cancelled",
      },
    };
    return configs[status] || configs["ASSIGNED"];
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📦";
    switch (category.toLowerCase()) {
      case "fresh meals":
        return "🍽️";
      case "baked goods":
        return "🥐";
      case "fruits & vegetables":
      case "fruits-vegetables":
        return "🥦";
      case "dairy products":
      case "dairy":
        return "🥛";
      case "packaged food":
      case "packaged-goods":
        return "📦";
      case "beverages":
        return "🥤";
      default:
        return "📦";
    }
  };

  const getCategoryLabel = (category) => {
    if (!category) return "Unknown";
    return category.replace(/-/g, " ");
  };

  // FIX: Use the callback prop instead of doing Firebase operations directly
  const handleConfirmDelivery = async (deliveryId, claimId, listingId) => {
    setProcessing(deliveryId);
    try {
      // Use the callback prop to let parent handle the operation
      await onConfirmDelivery(deliveryId, claimId, listingId);
      // Close modal on success
      setSelectedDelivery(null);
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Failed to confirm delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  // FIX: Use the callback prop instead of doing Firebase operations directly
  const handleCancelDelivery = async (delivery) => {
    setProcessing(delivery.deliveryId);
    try {
      // Use the callback prop to let parent handle the operation
      if (onCancelDelivery) {
        await onCancelDelivery(delivery.deliveryId, delivery.claimId);
      } else {
        // Fallback to direct Firebase operations if callback not provided
        await directCancelDelivery(delivery);
      }
      
      // Show success message
      alert(
        "Delivery cancelled successfully. It's now available for other volunteers."
      );

      // Close the details modal
      setSelectedDelivery(null);
    } catch (error) {
      console.error("Error canceling delivery:", error);
      alert("Failed to cancel delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  // FIX: Use the callback prop instead of doing Firebase operations directly
  const handleCompleteDelivery = async (delivery) => {
    setProcessing(delivery.deliveryId);
    try {
      // Use the callback prop to let parent handle the operation
      if (onCompleteDelivery) {
        await onCompleteDelivery(delivery.deliveryId, delivery.claimId, delivery.listingId);
      } else {
        // Fallback to direct Firebase operations if callback not provided
        await directCompleteDelivery(delivery);
      }

      // Show success message
      alert("Delivery marked as completed successfully!");

      // Close the details modal
      setSelectedDelivery(null);
    } catch (error) {
      console.error("Error completing delivery:", error);
      alert("Failed to complete delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  // Fallback direct Firebase operations (keep as backup)
  const directCancelDelivery = async (delivery) => {
    const deliveryRef = doc(db, "deliveryAssignments", delivery.deliveryId);
    await updateDoc(deliveryRef, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    const claimRef = doc(db, "claims", delivery.claimId);
    await updateDoc(claimRef, {
      volunteerAssigned: null,
      volunteerAssignedAt: null,
      status: "CLAIMED",
      updatedAt: new Date(),
    });
  };

  const directCompleteDelivery = async (delivery) => {
    const deliveryRef = doc(db, "deliveryAssignments", delivery.deliveryId);
    await updateDoc(deliveryRef, {
      status: "DELIVERED",
      deliveredAt: new Date(),
      updatedAt: new Date(),
    });

    const claimRef = doc(db, "claims", delivery.claimId);
    await updateDoc(claimRef, {
      status: "COLLECTED",
      collectedAt: new Date(),
      updatedAt: new Date(),
    });

    const listingRef = doc(db, "foodListings", delivery.listingId);
    await updateDoc(listingRef, {
      listingStatus: "COLLECTED",
      updatedAt: new Date(),
    });
  };

  // Fetch donor data
  const fetchDonorData = async (donorEmail) => {
    if (!donorEmail) return;
    
    // Check cache first
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

  const handleOpenChat = (delivery) => {
    if (onOpenChat) {
      onOpenChat(delivery);
    } else {
      // Fallback: Open chat modal directly
      openChatModal(delivery);
    }
  };

  // Chat functionality - Open chat modal
  const openChatModal = async (delivery) => {
    setChatModal({ open: true, delivery });

    // Get donor email from the delivery data
    const donorEmail = delivery.donorEmail || delivery.listingCompany;
    const volunteerEmail = auth.currentUser.email;
    const donationId = delivery.listingId;

    // Calculate chat room ID immediately
    const calculatedChatRoomId = `${donorEmail.replace("@", "_")}_${volunteerEmail.replace("@", "_")}_${donationId}`;

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
          ngoEmail: volunteerEmail, // Backend expects 'ngoEmail' but we're using it for volunteer
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

  const closeChatModal = () => {
    if (chatModal.unsubscribe) {
      chatModal.unsubscribe();
    }
    setChatModal({ open: false, delivery: null });
    setDonorData(null);
    setMessages([]);
    setChatRoomId(null);
    setNewMessage("");
  };

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

  // Send message with optimistic updates
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
      senderName: userData.name || user.displayName || "Volunteer",
      senderRole: userData.role || "volunteer",
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
        senderName: userData.name || user.displayName || "Volunteer",
        senderRole: userData.role || "volunteer",
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
      
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate statistics for header
  const totalDeliveries = deliveries.length;
  const activeDeliveries = deliveries.filter(
    (d) => d.status === "ASSIGNED" || d.status === "PICKED_UP"
  ).length;
  const completedDeliveries = deliveries.filter(
    (d) => d.status === "DELIVERED"
  ).length;

  return (
    <div className="modern-my-deliveries">
      {/* Controls Section */}
      <div className="deliveries-controls">
        <div className="filter-section">
          <div className="filter-pills">
            {[
              { key: "all", label: "All Deliveries", count: totalDeliveries },
              { key: "ASSIGNED", label: "Active", count: activeDeliveries },
              {
                key: "DELIVERED",
                label: "Completed",
                count: completedDeliveries,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                className={`filter-pill ${
                  activeFilter === filter.key ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
                <span className="pill-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">🚗</div>
          <h3>No deliveries found</h3>
          <p>
            {activeFilter === "all"
              ? "You haven't accepted any deliveries yet. Check available deliveries to get started."
              : `No ${
                  activeFilter === "ASSIGNED" ? "active" : "completed"
                } deliveries found.`}
          </p>
        </div>
      ) : (
        <div className="deliveries-grid">
          {filteredDeliveries.map((delivery) => {
            const statusConfig = getStatusConfig(delivery.status);

            // DEBUG: Log delivery status to console
            console.log("Delivery status:", delivery.status, "for delivery:", delivery.deliveryId);

            return (
              <div key={delivery.deliveryId} className="delivery-card">
                {/* Header Section */}
                <div className="card-header">
                  <div className="delivery-title">
                    <h3>{delivery.foodType}</h3>
                    <span className="delivery-date">
                      Accepted on {formatDate(delivery.assignedAt)}
                    </span>
                  </div>

                  <div className="delivery-status">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: statusConfig.color }}
                    ></span>
                    <span
                      className="status-text"
                      style={{ color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                   
                  </div>
                </div>

                {/* Content Section */}
                <div className="card-content">
                  <div className="delivery-details">
                    <div className="detail-row">
                      <span className="detail-icon">
                        {getCategoryIcon(delivery.typeOfFood)}
                      </span>
                      <span className="detail-text">
                        {getCategoryLabel(delivery.typeOfFood)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📦</span>
                      <span className="detail-text">
                        {delivery.quantity} {delivery.unit}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">
                        From: {delivery.listingCompany || delivery.donorName}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">🏠</span>
                      <span className="detail-text">
                        To: {delivery.ngoName}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Pickup by {formatDate(delivery.collectBy)}
                      </span>
                    </div>

                    {delivery.specialInstructions && (
                      <div className="detail-row">
                        <span className="detail-icon">⚠️</span>
                        <span className="detail-text">
                          {delivery.specialInstructions}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Tracking */}
                  {(delivery.status === "ASSIGNED" ||
                    delivery.status === "PICKED_UP") && (
                    <div className="progress-container">
                      <div className="progress-steps">
                        <div
                          className={`progress-step ${
                            delivery.status === "ASSIGNED" ||
                            delivery.status === "PICKED_UP" ||
                            delivery.status === "DELIVERED"
                              ? "active"
                              : ""
                          }`}
                        >
                          <span className="step-number">1</span>
                          <span className="step-label">Accepted</span>
                        </div>
                        <div className="progress-connector"></div>
                        <div
                          className={`progress-step ${
                            delivery.status === "PICKED_UP" ||
                            delivery.status === "DELIVERED"
                              ? "active"
                              : ""
                          }`}
                        >
                          <span className="step-number">2</span>
                          <span className="step-label">Picked Up</span>
                        </div>
                        <div className="progress-connector"></div>
                        <div
                          className={`progress-step ${
                            delivery.status === "DELIVERED" ? "active" : ""
                          }`}
                        >
                          <span className="step-number">3</span>
                          <span className="step-label">Delivered</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {delivery.status === "DELIVERED" && delivery.deliveredAt && (
                    <div className="completion-banner">
                      <span className="completed-icon">✅</span>
                      <div className="completion-details">
                        <span className="completed-text">
                          Successfully delivered!
                        </span>
                        <span className="completion-date">
                          Delivered on {formatDate(delivery.deliveredAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Section */}
                <div className="card-actions">
                  <button
                    className="action-btn outline"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    Details
                  </button>

                  {/* Chat Button */}
                  {(delivery.status === "ASSIGNED" ||
                    delivery.status === "PICKED_UP") && (
                    <button
                      className="action-btn chat"
                      onClick={() => handleOpenChat(delivery)}
                    >
                      💬 Chat
                    </button>
                  )}


                  {/* Action Buttons based on status */}
                  {delivery.status === "ASSIGNED" && (
                    <>
                      <button
                        className="action-btn secondary"
                        onClick={() => handleCancelDelivery(delivery)}
                        disabled={processing === delivery.deliveryId}
                      >
                        {processing === delivery.deliveryId
                          ? "Canceling..."
                          : "Cancel"}
                      </button>
                      <button
                        className="action-btn primary"
                        onClick={() =>
                          handleConfirmDelivery(
                            delivery.deliveryId,
                            delivery.claimId,
                            delivery.listingId
                          )
                        }
                        disabled={processing === delivery.deliveryId}
                      >
                        {processing === delivery.deliveryId
                          ? "Confirming..."
                          : "Pick Up"}
                      </button>
                    </>
                  )}

           
                  {delivery.status === "PICKED_UP" && (
                    <button
                      className="action-btn primary"
                      onClick={() => handleCompleteDelivery(delivery)}
                      disabled={processing === delivery.deliveryId}
                    >
                      {processing === delivery.deliveryId
                        ? "Completing..."
                        : "Complete Delivery"}
                    </button>
                  )}

                  {delivery.status === "DELIVERED" && (
                    <div className="completed-actions">
                      <button className="action-btn outline">
                        View Details
                      </button>
                      <button className="action-btn outline">
                        Share Feedback
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal with Map */}
      {selectedDelivery && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDelivery(null)}
        >
          <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delivery Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedDelivery(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-section">
                <h3>Food Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Food Type:</span>
                    <span className="info-value">
                      {selectedDelivery.foodType}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Quantity:</span>
                    <span className="info-value">
                      {selectedDelivery.quantity} {selectedDelivery.unit}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Category:</span>
                    <span className="info-value">
                      {getCategoryIcon(selectedDelivery.typeOfFood)}
                      {getCategoryLabel(selectedDelivery.typeOfFood)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Delivery Route</h3>
                <div className="route-info">
                  <div className="location-card">
                    <span className="location-icon">📦</span>
                    <div className="location-details">
                      <span className="location-title">Pickup Location</span>
                      <span className="location-name">
                        {selectedDelivery.listingCompany ||
                          selectedDelivery.donorName}
                      </span>
                      <span className="location-address">
                        {selectedDelivery.address || selectedDelivery.location}
                      </span>
                    </div>
                  </div>

                  <div className="route-connector">
                    <div className="connector-line"></div>
                    <span className="distance-badge">→ Delivery →</span>
                  </div>

                  <div className="location-card">
                    <span className="location-icon">🏠</span>
                    <div className="location-details">
                      <span className="location-title">Delivery Location</span>
                      <span className="location-name">
                        {selectedDelivery.ngoName}
                      </span>
                      <span className="location-address">
                        {selectedDelivery.ngoAddress || "Address not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                <div className="map-section" style={{ marginTop: "15px" }}>
                  <h4>Route to Delivery Point</h4>
                  {selectedDelivery.coordinates && (
                    <RouteMap
                      origin={userLocation}
                      destination={selectedDelivery.coordinates}
                      originLabel="Your Location"
                      destinationLabel={selectedDelivery.ngoName}
                      originIcon="👤"
                      destinationIcon="🏠"
                      mapContainerStyle={{ width: "100%", height: "300px" }}
                      zoom={12}
                      showRouteInfo={true}
                      autoShowRoute={true}
                      className="delivery-route-map"
                    />
                  )}
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <p>
                      <strong>Delivery Address:</strong>{" "}
                      {selectedDelivery.ngoAddress || "Address not specified"}
                    </p>
                    <p>
                      <strong>Food Type:</strong> {selectedDelivery.foodType}
                    </p>
                    {userLocation.lat === -26.2041 && userLocation.lng === 28.0473 && (
                      <p style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}>
                        💡 Tip: Allow location access for personalized route directions from your current location
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Delivery Timeline</h3>
                <div className="timeline-info">
                  <div className="timeline-item">
                    <span className="timeline-label">Accepted On:</span>
                    <span className="timeline-value">
                      {formatDate(selectedDelivery.assignedAt)}
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">Pickup By:</span>
                    <span className="timeline-value">
                      {formatDate(selectedDelivery.collectBy)}
                    </span>
                  </div>
                  {selectedDelivery.deliveredAt && (
                    <div className="timeline-item">
                      <span className="timeline-label">Delivered On:</span>
                      <span className="timeline-value">
                        {formatDate(selectedDelivery.deliveredAt)}
                      </span>
                    </div>
                  )}
                  <div className="timeline-item">
                    <span className="timeline-label">Status:</span>
                    <span
                      className="timeline-value status-indicator"
                      style={{
                        color: getStatusConfig(selectedDelivery.status).color,
                      }}
                    >
                      {getStatusConfig(selectedDelivery.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDelivery.specialInstructions && (
                <div className="modal-section">
                  <h3>Special Instructions</h3>
                  <div className="instructions-card">
                    <p>{selectedDelivery.specialInstructions}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {/* Action buttons in modal footer */}
              {selectedDelivery.status === "ASSIGNED" && (
                <>
                  <button
                    className="modal-btn secondary"
                    onClick={() => handleCancelDelivery(selectedDelivery)}
                    disabled={processing === selectedDelivery.deliveryId}
                  >
                    {processing === selectedDelivery.deliveryId
                      ? "Canceling..."
                      : "Cancel Delivery"}
                  </button>
                  <button
                    className="modal-btn primary"
                    onClick={() =>
                      handleConfirmDelivery(
                        selectedDelivery.deliveryId,
                        selectedDelivery.claimId,
                        selectedDelivery.listingId
                      )
                    }
                    disabled={processing === selectedDelivery.deliveryId}
                  >
                    {processing === selectedDelivery.deliveryId
                      ? "Confirming..."
                      : "Confirm Pickup"}
                  </button>
                </>
              )}

              {selectedDelivery.status === "PICKED_UP" && (
                <button
                  className="modal-btn primary"
                  onClick={() => handleCompleteDelivery(selectedDelivery)}
                  disabled={processing === selectedDelivery.deliveryId}
                >
                  {processing === selectedDelivery.deliveryId
                    ? "Completing..."
                    : "Mark as Delivered"}
                </button>
              )}

              {(selectedDelivery.status === "ASSIGNED" ||
                selectedDelivery.status === "PICKED_UP") && (
                <button
                  className="modal-btn chat"
                  onClick={() => {
                    handleOpenChat(selectedDelivery);
                    setSelectedDelivery(null);
                  }}
                >
                  💬 Chat with Donor
                </button>
              )}

              <button
                className="modal-btn outline"
                onClick={() => setSelectedDelivery(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
                    ? `${donorData.name || donorData.companyName}`
                    : "Donor"}
                </p>
              </div>
              <button className="close-button" onClick={closeChatModal}>
                ✕
              </button>
            </div>

            <div className="chat-body">
              {donorData && (
                <div className="donor-info">
                  <div className="donor-avatar">🏪</div>
                  <div className="donor-details">
                    <h4>{donorData.name || donorData.companyName}</h4>
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
                      <div className="chat-placeholder-icon">💬</div>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const user = auth.currentUser;
                      const isMyMessage = message.senderEmail === user?.email;
                      
                      return (
                        <div
                          key={message.id}
                          className={`message ${isMyMessage ? "sent own-message" : "received other-message"}`}
                        >
                          <div className="message-content">
                            <div className="message-header">
                              <span className="sender-name">
                                {isMyMessage ? "You" : message.senderName}
                              </span>
                              <span className="message-time">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>
                            <div className="message-text">{message.text}</div>
                            {message.status && message.isOptimistic && (
                              <div className="message-status">
                                {message.status === "sending" && "Sending..."}
                                {message.status === "failed" && "Failed to send"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="message-input-container">
                <div className="message-input-group">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <button
                    className="send-button"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? "..." : "📤"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stats Summary */}
      <div className="stats-summary">
        <h3>Delivery Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{totalDeliveries}</span>
            <span className="stat-label">Total Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{activeDeliveries}</span>
            <span className="stat-label">Active Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{completedDeliveries}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDeliveries;