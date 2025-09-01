import React, { useState, useEffect } from "react";
import { auth } from "../../firebaseConfig";
import "../styles/ActveDonations.css";

const ActiveDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [chatModal, setChatModal] = useState({ open: false, donation: null });
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Firebase Functions base URL
  const FUNCTIONS_BASE_URL = "https://us-central1-ubuntu-eats.cloudfunctions.net";

  // Helper function to get auth token
  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };

  // Helper function to make authenticated HTTP requests
  const makeAuthenticatedRequest = async (endpoint, data = null) => {
    const token = await getAuthToken();
    
    const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Fetch donor's donations
  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await makeAuthenticatedRequest('getDonorDonations', {
        limit: 100
      });

      if (result.success) {
        const transformedDonations = result.donations.map(donation => ({
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
          coordinates: donation.coordinates
        }));

        setDonations(transformedDonations);
      } else {
        throw new Error(result.message || 'Failed to fetch donations');
      }
    } catch (error) {
      console.error('Error fetching my donations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Map database status to display status
  const mapDatabaseStatusToDisplay = (dbStatus) => {
    const statusMap = {
      'UNCLAIMED': 'Available',
      'PENDING_PICKUP': 'Available', 
      'IN_TRANSIT': 'Collected',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[dbStatus] || dbStatus;
  };

  // Check if donation has been claimed (collected status)
  const isDonationClaimed = (donation) => {
    return donation.status === 'Collected' || donation.status === 'Completed';
  };

  // Open chat modal
  const openChatModal = (donation) => {
    setChatModal({ open: true, donation });
    // Load existing messages for this donation (you can implement this later)
    loadChatMessages(donation.listingID);
  };

  // Close chat modal
  const closeChatModal = () => {
    setChatModal({ open: false, donation: null });
    setChatMessages([]);
    setNewMessage("");
  };

  // Load chat messages (placeholder - implement with your backend)
  const loadChatMessages = (listingID) => {
    // Mock messages for demo - replace with actual API call
    const mockMessages = [
      {
        id: 1,
        sender: 'recipient',
        senderName: 'Hope Community Center',
        message: 'Thank you for the donation! When can we arrange pickup?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        avatar: '🏢'
      },
      {
        id: 2,
        sender: 'donor',
        senderName: 'You',
        message: 'You\'re welcome! Pickup is available anytime between 2-6 PM today.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        avatar: '👤'
      }
    ];
    setChatMessages(mockMessages);
  };

  // Send message (placeholder - implement with your backend)
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'donor',
      senderName: 'You',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      avatar: '👤'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage("");

    // TODO: Send message to backend/Firebase
    // sendMessageToBackend(chatModal.donation.listingID, message);
  };

  // Handle enter key in chat
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format chat timestamp
  const formatChatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Map display status to database status
  const mapDisplayStatusToDatabase = (displayStatus) => {
    const statusMap = {
      'Available': 'UNCLAIMED',
      'Collected': 'IN_TRANSIT',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED'
    };
    return statusMap[displayStatus] || displayStatus;
  };

  // Update donation status
  const updateStatus = async (donationId, newStatus) => {
    try {
      setUpdating(donationId);
      
      const dbStatus = mapDisplayStatusToDatabase(newStatus);
      
      const result = await makeAuthenticatedRequest('updateDonationStatus', {
        listingID: donationId,
        status: dbStatus
      });

      if (result.success) {
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId || donation.listingID === donationId
              ? { ...donation, status: newStatus }
              : donation
          )
        );
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // Filter donations
  const filteredDonations = donations.filter(donation => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return ["Available"].includes(donation.status);
    if (statusFilter === "completed") return ["Completed", "Collected"].includes(donation.status);
    if (statusFilter === "cancelled") return ["Cancelled"].includes(donation.status);
    return donation.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Get status configuration
  const getStatusConfig = (status) => {
    const configs = {
      "Available": { 
        color: "#10b981", 
        bg: "#d1fae5", 
        icon: "🟢", 
        pulse: true 
      },
      "Collected": { 
        color: "#3b82f6", 
        bg: "#dbeafe", 
        icon: "📦", 
        pulse: false 
      },
      "Completed": { 
        color: "#059669", 
        bg: "#a7f3d0", 
        icon: "✅", 
        pulse: false 
      },
      "Cancelled": { 
        color: "#ef4444", 
        bg: "#fecaca", 
        icon: "❌", 
        pulse: false 
      }
    };
    return configs[status] || configs["Available"];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
      {/* Header Section */}
      <div className="donations-header">
        <div className="header-main">
          <h1>My Food Donations</h1>
          <p>Track and manage your contribution to reducing food waste</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{donations.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{donations.filter(d => d.status === "Available").length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{donations.filter(d => d.status === "Completed").length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="donations-controls">
        <div className="filter-section">
          <div className="filter-pills">
            {[
              { key: "all", label: "All", count: donations.length },
              { key: "active", label: "Active", count: donations.filter(d => d.status === "Available").length },
              { key: "completed", label: "Completed", count: donations.filter(d => ["Completed", "Collected"].includes(d.status)).length },
              { key: "cancelled", label: "Cancelled", count: donations.filter(d => d.status === "Cancelled").length }
            ].map(filter => (
              <button
                key={filter.key}
                className={`filter-pill ${statusFilter === filter.key ? "active" : ""}`}
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
              : `No ${statusFilter} donations at the moment`
            }
          </p>
        </div>
      ) : (
        <div className={`donations-grid ${viewMode === "list" ? "list-view" : "grid-view"}`}>
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
                        className={`status-dot ${statusConfig.pulse ? 'pulse' : ''}`}
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
                          onClick={() => updateStatus(donation.listingID, "Cancelled")}
                          disabled={updating === donation.listingID}
                        >
                          {updating === donation.listingID ? "..." : "Cancel"}
                        </button>
                        <button
                          className="action-button primary"
                          onClick={() => updateStatus(donation.listingID, "Collected")}
                          disabled={updating === donation.listingID}
                        >
                          {updating === donation.listingID ? "..." : "Mark Collected"}
                        </button>
                      </>
                    )}

                    {donation.status === "Collected" && (
                      <>
                        <button
                          className="action-button chat"
                          onClick={() => openChatModal(donation)}
                        >
                          💬 Chat
                        </button>
                        <button
                          className="action-button primary"
                          onClick={() => updateStatus(donation.listingID, "Completed")}
                          disabled={updating === donation.listingID}
                        >
                          {updating === donation.listingID ? "..." : "Mark Complete"}
                        </button>
                      </>
                    )}

                    {donation.status === "Completed" && isDonationClaimed(donation) && (
                      <button
                        className="action-button chat"
                        onClick={() => openChatModal(donation)}
                      >
                        💬 Chat History
                      </button>
                    )}

                    <button 
                      className="action-button outline"
                      onClick={() => setSelectedDonation(donation)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedDonation && (
        <div className="modal-backdrop" onClick={() => setSelectedDonation(null)}>
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
                  <img src={selectedDonation.imageURL} alt={selectedDonation.foodType} />
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
                      <span style={{ color: getStatusConfig(selectedDonation.status).color }}>
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
                        <span>{formatDate(selectedDonation.scheduledTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDonation.description && (
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p className="description-text">{selectedDonation.description}</p>
                  </div>
                )}

                {selectedDonation.specialInstructions && (
                  <div className="detail-section">
                    <h4>Special Instructions</h4>
                    <p className="instruction-text">{selectedDonation.specialInstructions}</p>
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

      {/* Chat Modal */}
      {chatModal.open && (
        <div className="modal-backdrop" onClick={closeChatModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-title">
                <h3>💬 Chat - {chatModal.donation?.foodType}</h3>
                <p>Communicate with the recipient</p>
              </div>
              <button className="close-button" onClick={closeChatModal}>
                ✕
              </button>
            </div>

            <div className="chat-body">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-messages-icon">💬</div>
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`message ${message.sender === 'donor' ? 'own-message' : 'other-message'}`}
                    >
                      <div className="message-avatar">
                        {message.avatar}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">{message.senderName}</span>
                          <span className="message-time">{formatChatTime(message.timestamp)}</span>
                        </div>
                        <div className="message-text">
                          {message.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input-section">
                <div className="chat-input-container">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type your message..."
                    className="chat-input"
                    rows="2"
                  />
                  <button 
                    className="send-button"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <span className="send-icon">➤</span>
                  </button>
                </div>
                <p className="chat-hint">Press Enter to send • Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDonations;