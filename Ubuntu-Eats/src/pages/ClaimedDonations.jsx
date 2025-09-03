import React, { useState, useEffect } from "react";
import "../styles/ClaimedDonations.css";
import { auth } from "../../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import RouteMap from "./RouteMap";

const ClaimedDonations = ({
  donations,
  onSetCollectionMethod,
  onConfirmCollection,
  onCancelClaim,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [processing, setProcessing] = useState(null);
  const [volunteerTimeoutDonations, setVolunteerTimeoutDonations] = useState(
    []
  );
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [userLocation, setUserLocation] = useState({
    lat: -26.2041,
    lng: 28.0473,
  }); // Default to Johannesburg

  // Chat functionality states
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [donorData, setDonorData] = useState(null);
  const [loadingDonor, setLoadingDonor] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageCache, setMessageCache] = useState(new Map());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userCache, setUserCache] = useState(new Map());

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Timer effect to check for volunteer timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedTimeouts = [];

      donations.forEach((donation) => {
        if (
          donation.status === "CLAIMED" &&
          donation.collectionMethod === "volunteer" &&
          (!donation.volunteerAssigned ||
            donation.volunteerAssigned === null) &&
          donation.claimDate
        ) {
          const claimDate = donation.claimDate.toDate
            ? donation.claimDate.toDate()
            : new Date(donation.claimDate);

          const pickupTime = donation.pickupTime
            ? new Date(donation.pickupTime)
            : new Date(claimDate.getTime() + 24 * 60 * 60 * 1000);

          const timeDifference = pickupTime - claimDate;
          const halfTime = claimDate.getTime() + timeDifference / 2;

          if (
            now.getTime() >= halfTime &&
            !volunteerTimeoutDonations.includes(donation.claimId)
          ) {
            updatedTimeouts.push(donation.claimId);
          }
        }
      });

      if (updatedTimeouts.length > 0) {
        setVolunteerTimeoutDonations((prev) => [...prev, ...updatedTimeouts]);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [donations, volunteerTimeoutDonations]);

  const filteredDonations = donations.filter((donation) => {
    if (activeFilter === "all") return true;
    return donation.status === activeFilter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      CLAIMED: {
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "🔔",
        label: "To Collect",
      },
      COLLECTED: {
        color: "#059669",
        bg: "#a7f3d0",
        icon: "✅",
        label: "Collected",
      },
      CANCELLED: {
        color: "#ef4444",
        bg: "#fecaca",
        icon: "❌",
        label: "Cancelled",
      },
    };
    return configs[status] || configs["CLAIMED"];
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📦";
    switch (category.toLowerCase()) {
      case "fresh meals":
      case "fresh-meals":
        return "🍽️";
      case "baked goods":
      case "bakery":
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

  const handleSetCollectionMethod = async (claimId, method) => {
    setProcessing(claimId);
    try {
      await onSetCollectionMethod(claimId, method);
      if (method === "self") {
        setVolunteerTimeoutDonations((prev) =>
          prev.filter((id) => id !== claimId)
        );
      }
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
      setVolunteerTimeoutDonations((prev) =>
        prev.filter((id) => id !== claimId)
      );
    } catch (error) {
      console.error("Error canceling claim:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleVolunteerTimeoutAction = async (claimId, listingId, action) => {
    setProcessing(claimId);
    try {
      if (action === "self") {
        await onSetCollectionMethod(claimId, "self");
      } else if (action === "cancel") {
        await onCancelClaim(claimId, listingId);
      }
      setVolunteerTimeoutDonations((prev) =>
        prev.filter((id) => id !== claimId)
      );
    } catch (error) {
      console.error("Error handling volunteer timeout:", error);
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
    setUserCache((prev) => new Map(prev).set(userEmail, userData));
  };

  // Fetch donor data
  const fetchDonorData = async (donorEmail) => {
    if (!donorEmail) return;

    // Check cache first - instant load
    const cachedUser = getCachedUser(donorEmail);
    if (cachedUser) {
      setDonorData(cachedUser);
      setLoadingDonor(false);
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

  // Message date formatting functions
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return null;

    let date;
    if (timestamp?.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      return null;
    }

    return date;
  };

  const getDateString = (date) => {
    if (!date) return "";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare just dates
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const yesterdayDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (messageDate.getTime() === todayDate.getTime()) {
      return "Today";
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true; // Always show for first message

    const currentDate = formatMessageDate(currentMessage.timestamp);
    const previousDate = formatMessageDate(previousMessage.timestamp);

    if (!currentDate || !previousDate) return false;

    // Compare dates (ignoring time)
    const currentDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const previousDay = new Date(
      previousDate.getFullYear(),
      previousDate.getMonth(),
      previousDate.getDate()
    );

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

    // Use the correct donor email field
    const donorEmail = donation.donorEmail || donation.listingCompany;
    const ngoEmail = auth.currentUser.email;
    const donationId = donation.listingID || donation.id;

    const calculatedChatRoomId = `${donorEmail.replace(
      "@",
      "_"
    )}_${ngoEmail.replace("@", "_")}_${donationId}`;

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

    const tempId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const optimisticMessage = {
      id: tempId,
      text: messageText,
      senderEmail: user.email,
      senderName: userData.name || user.displayName || "User",
      senderRole: userData.role || "ngo",
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
        senderRole: userData.role || "ngo",
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

  // Calculate statistics for header
  const totalClaims = donations.length;
  const toCollectClaims = donations.filter(
    (d) => d.status === "CLAIMED"
  ).length;
  const collectedClaims = donations.filter(
    (d) => d.status === "COLLECTED"
  ).length;

  return (
    <div className="modern-claimed-donations">
      {/* Controls Section */}
      <div className="donations-controls">
        <div className="filter-section">
          <div className="filter-pills">
            {[
              { key: "all", label: "All Claims", count: totalClaims },
              { key: "CLAIMED", label: "To Collect", count: toCollectClaims },
              { key: "COLLECTED", label: "Collected", count: collectedClaims },
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

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">📦</div>
          <h3>No claimed donations</h3>
          <p>
            You haven't claimed any donations yet. Browse available donations to
            get started.
          </p>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map((donation) => {
            const statusConfig = getStatusConfig(donation.status);

            return (
              <div key={donation.claimId} className="donation-item">
                {/* Image Section */}
                {donation.imageURL && (
                  <div className="item-image">
                    <img
                      src={donation.imageURL}
                      alt={donation.foodType || "Food donation"}
                    />
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
                      <h3>
                        {donation.listingCompany ||
                          donation.donorName ||
                          "Unknown Donor"}
                      </h3>
                      <span className="claim-date">
                        Claimed on {formatDate(donation.claimDate)}
                      </span>
                    </div>

                    <div className="item-status">
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

                  <div className="content-details">
                    <div className="food-details">
                      <h4>{donation.foodType || "Food Donation"}</h4>
                      <span className="item-quantity">
                        {donation.quantity} {donation.unit || "units"}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">
                        {getCategoryIcon(
                          donation.typeOfFood || donation.category
                        )}
                      </span>
                      <span className="detail-text">
                        {getCategoryLabel(
                          donation.typeOfFood || donation.category
                        )}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Pickup by{" "}
                        {formatDate(donation.collectBy || donation.pickupTime)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">
                        {donation.address ||
                          donation.location ||
                          "Location not specified"}
                      </span>
                    </div>

                    {donation.specialInstructions && (
                      <div className="detail-row">
                        <span className="detail-icon">⚠️</span>
                        <span className="detail-text">
                          {donation.specialInstructions}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Volunteer Timeout Notification */}
                  {volunteerTimeoutDonations.includes(donation.claimId) && (
                    <div className="volunteer-timeout-notification">
                      <div className="timeout-alert">
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                          <h4>No Volunteer Available</h4>
                          <p>
                            No volunteer has been assigned yet. Would you like
                            to collect yourself or cancel this claim?
                          </p>
                          <div className="timeout-actions">
                            <button
                              className="action-button primary"
                              onClick={() =>
                                handleVolunteerTimeoutAction(
                                  donation.claimId,
                                  donation.id || donation.listingId,
                                  "self"
                                )
                              }
                              disabled={processing === donation.claimId}
                            >
                              {processing === donation.claimId
                                ? "Processing..."
                                : "Collect Myself"}
                            </button>
                            <button
                              className="action-button secondary"
                              onClick={() =>
                                handleVolunteerTimeoutAction(
                                  donation.claimId,
                                  donation.id || donation.listingId,
                                  "cancel"
                                )
                              }
                              disabled={processing === donation.claimId}
                            >
                              {processing === donation.claimId
                                ? "Canceling..."
                                : "Cancel Claim"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {donation.status === "CLAIMED" && (
                    <div className="collection-method">
                      <h4>Collection Method</h4>
                      <div className="method-options">
                        <button
                          className={`action-button ${
                            donation.collectionMethod === "self"
                              ? "primary"
                              : "outline"
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
                          className={`action-button ${
                            donation.collectionMethod === "volunteer"
                              ? "primary"
                              : "outline"
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
                          Please collect the donation at the scheduled time.
                          Don't forget to confirm collection when you receive
                          it.
                        </p>
                      </div>
                    )}
                </div>

                {/* Action Section */}
                <div className="item-actions">
                  <button
                    className="action-button outline"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    Details
                  </button>

                  {/* Chat Button - Only show for active claims */}
                  {donation.status === "CLAIMED" && (
                    <button
                      className="action-button chat"
                      onClick={() => openChatModal(donation)}
                    >
                      💬 Chat
                    </button>
                  )}

                  {donation.status === "CLAIMED" && (
                    <>
                      <button
                        className="action-button secondary"
                        onClick={() =>
                          handleCancelClaim(
                            donation.claimId,
                            donation.id || donation.listingId
                          )
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Canceling..."
                          : "Cancel Claim"}
                      </button>
                      {donation.collectionMethod === "self" && (
                        <button
                          className="action-button primary"
                          onClick={() =>
                            handleConfirmCollection(
                              donation.claimId,
                              donation.id || donation.listingId
                            )
                          }
                          disabled={processing === donation.claimId}
                        >
                          {processing === donation.claimId
                            ? "Confirming..."
                            : "Confirm Collection"}
                        </button>
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
            );
          })}
        </div>
      )}

      {/* Details Modal with Map */}
      {selectedDonation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDonation(null)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedDonation.listingCompany ||
                  selectedDonation.donorName ||
                  "Unknown Donor"}
              </h2>
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
                    alt={selectedDonation.foodType || "Food donation"}
                  />
                </div>
              )}

              <div className="modal-details">
                <div className="detail-section">
                  <h4>Food Details</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Food Type:</strong>
                      <span>
                        {selectedDonation.foodType || "Food Donation"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Quantity:</strong>
                      <span>
                        {selectedDonation.quantity}{" "}
                        {selectedDonation.unit || "units"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>
                        {getCategoryIcon(
                          selectedDonation.typeOfFood ||
                            selectedDonation.category
                        )}
                        {getCategoryLabel(
                          selectedDonation.typeOfFood ||
                            selectedDonation.category
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Pickup Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item full-width">
                      <strong>Location:</strong>
                      <span>
                        {selectedDonation.address ||
                          selectedDonation.location ||
                          "Location not specified"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Pickup By:</strong>
                      <span>
                        {formatDate(
                          selectedDonation.collectBy ||
                            selectedDonation.pickupTime
                        )}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact Person:</strong>
                      <span>{selectedDonation.contactPerson || "N/A"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact Phone:</strong>
                      <span>{selectedDonation.contactPhone || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                <div className="detail-section">
                  <h4>Route to Collection Point</h4>
                  <div className="map-section" style={{ marginTop: "15px" }}>
                    <RouteMap
                      origin={userLocation}
                      destination={
                        selectedDonation.coordinates || {
                          lat: -26.2041,
                          lng: 28.0473,
                        }
                      }
                      originLabel="Your Location"
                      destinationLabel={
                        selectedDonation.listingCompany ||
                        selectedDonation.donorName ||
                        "Donor"
                      }
                      originIcon="👤"
                      destinationIcon="🏪"
                      mapContainerStyle={{ width: "100%", height: "300px" }}
                      zoom={12}
                      showRouteInfo={true}
                      autoShowRoute={true}
                      className="donation-route-map"
                    />
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
                        <strong>Collection Address:</strong>{" "}
                        {selectedDonation.address ||
                          selectedDonation.location ||
                          "Address not specified"}
                      </p>
                      <p>
                        <strong>Food Type:</strong>{" "}
                        {selectedDonation.foodType || "Food Donation"}
                      </p>
                      <p>
                        <strong>Contact:</strong>{" "}
                        {selectedDonation.contactPerson || "N/A"}{" "}
                        {selectedDonation.contactPhone
                          ? `(${selectedDonation.contactPhone})`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedDonation.specialInstructions && (
                  <div className="detail-section">
                    <h4>Special Instructions</h4>
                    <p className="instruction-text">
                      {selectedDonation.specialInstructions}
                    </p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Claim Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Status:</strong>
                      <span
                        style={{
                          color: getStatusConfig(selectedDonation.status).color,
                        }}
                      >
                        {getStatusConfig(selectedDonation.status).label}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Claimed On:</strong>
                      <span>{formatDate(selectedDonation.claimDate)}</span>
                    </div>
                    {selectedDonation.collectionMethod && (
                      <div className="grid-item">
                        <strong>Collection Method:</strong>
                        <span>
                          {selectedDonation.collectionMethod === "self"
                            ? "Self Collection"
                            : "Volunteer Assistance"}
                        </span>
                      </div>
                    )}
                    {selectedDonation.collectedAt && (
                      <div className="grid-item">
                        <strong>Collected On:</strong>
                        <span>{formatDate(selectedDonation.collectedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {/* Chat button in modal footer for active claims */}
              {selectedDonation.status === "CLAIMED" && (
                <button
                  className="modal-button chat"
                  onClick={() => {
                    openChatModal(selectedDonation);
                    setSelectedDonation(null);
                  }}
                >
                  💬 Chat with Donor
                </button>
              )}
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
                      const isOwn =
                        message.senderEmail === auth.currentUser?.email;
                      const previousMessage =
                        index > 0 ? messages[index - 1] : null;
                      const showDateSeparator = shouldShowDateSeparator(
                        message,
                        previousMessage
                      );

                      // Fix timestamp handling for different formats
                      const formatTimestamp = (timestamp) => {
                        if (!timestamp) return "";

                        // Handle Firebase Timestamp objects
                        if (
                          timestamp?.toDate &&
                          typeof timestamp.toDate === "function"
                        ) {
                          return timestamp.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        }

                        // Handle optimistic timestamps (plain seconds)
                        if (timestamp?.seconds) {
                          return new Date(
                            timestamp.seconds * 1000
                          ).toLocaleTimeString([], {
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
                                {getDateString(
                                  formatMessageDate(message.timestamp)
                                )}
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
