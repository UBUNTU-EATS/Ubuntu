import React, { useState, useEffect } from "react";
import "../styles/AvailableDonations.css";
import RouteMap from "./RouteMap";
import { auth } from "../../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const AvailableDonations = ({ donations = [], onClaim }) => {
  const [filters, setFilters] = useState({
    category: "all",
    distance: "all",
    sortBy: "newest",
  });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showCollectionMethodModal, setShowCollectionMethodModal] =
    useState(false);
  const [donationToClaim, setDonationToClaim] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
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
    const donationId = donation.id;

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

  // 🧹 Filtering - EXCLUDE donations where forFarmers is true
  const filteredDonations = donations.filter((donation) => {
    // Exclude donations marked for farmers
    if (donation.forFarmers === true) {
      return false;
    }

    if (filters.category !== "all" && donation.category !== filters.category) {
      return false;
    }

    const distance = parseFloat(donation.distance || 0);
    if (filters.distance === "under5" && distance > 5) return false;
    if (filters.distance === "5to10" && (distance <= 5 || distance > 10))
      return false;
    if (filters.distance === "over10" && distance <= 10) return false;

    return true;
  });

  // 🔢 Sorting
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.pickupTime) - new Date(a.pickupTime);
    } else if (filters.sortBy === "closest") {
      return parseFloat(a.distance || 0) - parseFloat(b.distance || 0);
    } else if (filters.sortBy === "quantity") {
      return parseFloat(b.quantity || 0) - parseFloat(a.quantity || 0);
    }
    return 0;
  });

  // 🔧 Helpers
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "fresh-meals":
        return "🍽️";
      case "bakery":
        return "🥐";
      case "fruits-vegetables":
        return "🥦";
      case "dairy":
        return "🥛";
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

  const getUrgencyColor = (expiryDate) => {
    if (!expiryDate) return "#059669";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "#dc2626"; // red
    if (diffDays <= 3) return "#d97706"; // orange
    return "#059669"; // green
  };

  const handleClaimWithMethod = (method) => {
    if (donationToClaim && onClaim) {
      // Pass the status as "PENDING"
      onClaim(donationToClaim, method, "PENDING");
      setShowCollectionMethodModal(false);
      setSelectedDonation(null);
    }
  };

  const handleClaimClick = (donationId) => {
    setDonationToClaim(donationId);
    setShowCollectionMethodModal(true);
  };

  return (
    <div className="modern-available-donations">
      {/* Filters */}
      <div className="donations-controls">
        <div className="filter-section">
          <div className="filter-dropdowns">
            <div className="filter-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="fresh-meals">Fresh Meals</option>
                <option value="bakery">Bakery Items</option>
                <option value="fruits-vegetables">Fruits & Vegetables</option>
                <option value="dairy">Dairy Products</option>
                <option value="packaged-goods">Packaged Goods</option>
                <option value="beverages">Beverages</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="distance">Distance:</label>
              <select
                id="distance"
                value={filters.distance}
                onChange={(e) => handleFilterChange("distance", e.target.value)}
              >
                <option value="all">Any Distance</option>
                <option value="under5">Under 5 km</option>
                <option value="5to10">5-10 km</option>
                <option value="over10">Over 10 km</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortBy">Sort By:</label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="closest">Closest First</option>
                <option value="quantity">Largest Quantity</option>
              </select>
            </div>
          </div>
        </div>

        <div className="view-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ☰
            </button>
          </div>
          <div className="results-count">
            {sortedDonations.length} donation
            {sortedDonations.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Donation Cards */}
      {sortedDonations.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">📦</div>
          <h3>No donations available</h3>
          <p>Check back later for new food donations in your area</p>
        </div>
      ) : (
        <div
          className={`donations-grid ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {sortedDonations.map((donation) => {
            const urgencyColor = getUrgencyColor(donation.expiryDate);

            return (
              <div key={donation.id} className="donation-card">
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

                <div className="card-content">
                  <div className="card-header">
                    <h4>{donation.foodType}</h4>
                    <span className="item-quantity">
                      {donation.quantity} {donation.unit || "units"}
                    </span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-icon">
                        {getCategoryIcon(donation.category)}
                      </span>
                      <span className="detail-text">
                        {getCategoryLabel(donation.category)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">
                        {donation.distance
                          ? `${donation.distance} km away`
                          : "Distance not specified"}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Pickup by {formatDate(donation.pickupTime)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">🏢</span>
                      <span className="detail-text">
                        {donation.listingCompany ||
                          donation.donorName ||
                          "Unknown Donor"}
                      </span>
                    </div>

                    {donation.expiryDate && (
                      <div className="detail-row">
                        <span className="detail-icon">⏰</span>
                        <span
                          className="detail-text"
                          style={{ color: urgencyColor }}
                        >
                          Expires: {formatDate(donation.expiryDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-button outline"
                      onClick={() => setSelectedDonation(donation)}
                    >
                      Details
                    </button>

                    {/* Chat Button */}
                    <button
                      className="action-button chat"
                      onClick={() => openChatModal(donation)}
                    >
                      💬 Chat
                    </button>

                    <button
                      className="action-button primary"
                      onClick={() => handleClaimClick(donation.id)}
                    >
                      Claim Now
                    </button>
                  </div>
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
                  <h4>Food Details</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Food Type:</strong>
                      <span>{selectedDonation.foodType}</span>
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
                        {getCategoryIcon(selectedDonation.category)}
                        {getCategoryLabel(selectedDonation.category)}
                      </span>
                    </div>
                    {selectedDonation.expiryDate && (
                      <div className="grid-item">
                        <strong>Expiry Date:</strong>
                        <span
                          style={{
                            color: getUrgencyColor(selectedDonation.expiryDate),
                          }}
                        >
                          {formatDate(selectedDonation.expiryDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Donor Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Donor:</strong>
                      <span>
                        {selectedDonation.listingCompany ||
                          selectedDonation.donorName ||
                          "Unknown"}
                      </span>
                    </div>
                    <div className="grid-item full-width">
                      <strong>Location:</strong>
                      <span>{selectedDonation.location}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Distance:</strong>
                      <span>
                        {selectedDonation.distance
                          ? `${selectedDonation.distance} km away`
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Pickup By:</strong>
                      <span>{formatDate(selectedDonation.pickupTime)}</span>
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
                        {selectedDonation.location}
                      </p>
                      <p>
                        <strong>Food Type:</strong> {selectedDonation.foodType}
                      </p>
                      <p>
                        <strong>Quantity:</strong> {selectedDonation.quantity}{" "}
                        {selectedDonation.unit || "units"}
                      </p>
                      {selectedDonation.expiryDate && (
                        <p>
                          <strong>Expiry:</strong>
                          <span
                            style={{
                              color: getUrgencyColor(
                                selectedDonation.expiryDate
                              ),
                            }}
                          >
                            {formatDate(selectedDonation.expiryDate)}
                          </span>
                        </p>
                      )}
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
              </div>
            </div>

            <div className="modal-footer">
              {/* Chat button in modal footer */}
              <button
                className="modal-button chat"
                onClick={() => {
                  openChatModal(selectedDonation);
                  setSelectedDonation(null);
                }}
              >
                💬 Chat with Donor
              </button>

              <button
                className="modal-button secondary"
                onClick={() => setSelectedDonation(null)}
              >
                Cancel
              </button>
              <button
                className="modal-button primary"
                onClick={() => handleClaimClick(selectedDonation.id)}
              >
                Claim This Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Method Modal */}
      {showCollectionMethodModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCollectionMethodModal(false)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Collection Method</h2>
              <button
                className="close-button"
                onClick={() => setShowCollectionMethodModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="collection-methods">
                <button
                  className="collection-method-btn"
                  onClick={() => handleClaimWithMethod("self")}
                >
                  <span className="method-icon">🚗</span>
                  <div className="method-info">
                    <h4>Self Collection</h4>
                    <p>Collect the donation yourself</p>
                  </div>
                </button>
                <button
                  className="collection-method-btn"
                  onClick={() => handleClaimWithMethod("volunteer")}
                >
                  <span className="method-icon">🤝</span>
                  <div className="method-info">
                    <h4>Volunteer Assistance</h4>
                    <p>Request a volunteer to deliver</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "15px",
                }}
              >
                ⓘ After claiming, your request will be waiting for admin
                approval
              </p>
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

export default AvailableDonations;
