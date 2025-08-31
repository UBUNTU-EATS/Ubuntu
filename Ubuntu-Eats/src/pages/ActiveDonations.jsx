import React, { useState } from "react";
import "../styles/ActveDonations.css";

const ActiveDonations = ({ donations, setDonations }) => {
  const [filter, setFilter] = useState("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatDonation, setActiveChatDonation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Pickup":
        return "status-pending";
      case "In Transit":
        return "status-transit";
      case "Completed":
        return "status-completed";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const updateStatus = (donationId, newStatus) => {
    setDonations(prev =>
      prev.map(donation =>
        donation.id === donationId
          ? { ...donation, status: newStatus }
          : donation
      )
    );
  };

  const openChat = (donation) => {
    setActiveChatDonation(donation);
    setChatOpen(true);
    
    // Initialize chat if it doesn't exist
    if (!messages[donation.id]) {
      setMessages(prev => ({
        ...prev,
        [donation.id]: [
          {
            id: 1,
            sender: "system",
            text: `Chat started for ${donation.foodType} donation`,
            timestamp: Date.now(),
            type: "system"
          }
        ]
      }));
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    setActiveChatDonation(null);
    setNewMessage("");
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChatDonation) return;

    const message = {
      id: Date.now(),
      sender: "donor",
      text: newMessage.trim(),
      timestamp: Date.now(),
      type: "user"
    };

    setMessages(prev => ({
      ...prev,
      [activeChatDonation.id]: [
        ...(prev[activeChatDonation.id] || []),
        message
      ]
    }));

    setNewMessage("");

    // Simulate NGO response for demo
    setTimeout(() => {
      const responses = [
        "Thanks! We'll be there in 15 minutes.",
        "Perfect timing! Our volunteer is nearby.",
        "Got it! Any special pickup instructions?",
        "Excellent! We really appreciate this donation.",
        "On our way! Should we use the main entrance?",
        "Could you please have it ready at the loading dock?",
        "Our driver will call when they arrive.",
        "This will help feed 20 families tonight! 🙏"
      ];
      
      const ngoResponse = {
        id: Date.now() + 1,
        sender: "ngo",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now() + 1000,
        type: "user"
      };

      setMessages(prev => ({
        ...prev,
        [activeChatDonation.id]: [
          ...(prev[activeChatDonation.id] || []),
          ngoResponse
        ]
      }));
    }, 1500 + Math.random() * 2000); // Random delay for realism
  };

  const setQuickMessage = (text) => {
    setNewMessage(text);
  };

  const filteredDonations = donations.filter(donation => {
    if (filter === "all") return true;
    return donation.status.toLowerCase().replace(" ", "-") === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="active-donations">
      <div className="donations-header">
        <h2>Active Donations</h2>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({donations.length})
          </button>
          <button 
            className={`filter-tab ${filter === "pending-pickup" ? "active" : ""}`}
            onClick={() => setFilter("pending-pickup")}
          >
            Pending ({donations.filter(d => d.status === "Pending Pickup").length})
          </button>
          <button 
            className={`filter-tab ${filter === "in-transit" ? "active" : ""}`}
            onClick={() => setFilter("in-transit")}
          >
            In Transit ({donations.filter(d => d.status === "In Transit").length})
          </button>
          <button 
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({donations.filter(d => d.status === "Completed").length})
          </button>
        </div>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No donations found</h3>
          <p>
            {filter === "all" 
              ? "You haven't made any donations yet. Start by clicking the 'Donate Food' tab."
              : `No donations with status "${filter.replace("-", " ")}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map(donation => (
            <div key={donation.id} className="donation-card">
              <div className="card-header">
                <div className="donation-info">
                  <h3>{donation.foodType}</h3>
                  <p className="donation-quantity">{donation.quantity}</p>
                </div>
                <div className="header-actions">
                  <span className={`status-badge ${getStatusColor(donation.status)}`}>
                    {donation.status}
                  </span>
                  {donation.status !== "Completed" && donation.status !== "Cancelled" && (
                    <button 
                      className="chat-btn"
                      onClick={() => openChat(donation)}
                      title="Message volunteer"
                    >
                      💬
                    </button>
                  )}
                </div>
              </div>

              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">📅 Scheduled:</span>
                  <span className="info-value">
                    {formatDate(donation.scheduledTime)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">📍 Location:</span>
                  <span className="info-value">{donation.location}</span>
                </div>

                {donation.description && (
                  <div className="info-row">
                    <span className="info-label">📝 Description:</span>
                    <span className="info-value">{donation.description}</span>
                  </div>
                )}

                {donation.specialInstructions && (
                  <div className="info-row">
                    <span className="info-label">⚠️ Instructions:</span>
                    <span className="info-value">{donation.specialInstructions}</span>
                  </div>
                )}

                {donation.images && donation.images.length > 0 && (
                  <div className="donation-images">
                    <span className="info-label">🖼️ Images:</span>
                    <div className="images-thumbnails">
                      {donation.images.slice(0, 3).map(image => (
                        <img 
                          key={image.id} 
                          src={image.url} 
                          alt={image.name}
                          className="image-thumbnail"
                        />
                      ))}
                      {donation.images.length > 3 && (
                        <div className="more-images">
                          +{donation.images.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {donation.status === "Pending Pickup" && (
                  <>
                    <button 
                      className="action-btn secondary"
                      onClick={() => updateStatus(donation.id, "Cancelled")}
                    >
                      Cancel
                    </button>
                    <button 
                      className="action-btn primary"
                      onClick={() => updateStatus(donation.id, "In Transit")}
                    >
                      Mark as Picked Up
                    </button>
                  </>
                )}
                
                {donation.status === "In Transit" && (
                  <button 
                    className="action-btn primary"
                    onClick={() => updateStatus(donation.id, "Completed")}
                  >
                    Mark as Completed
                  </button>
                )}

                {donation.status === "Completed" && (
                  <div className="completion-info">
                    <span className="completed-text">✅ Successfully donated!</span>
                  </div>
                )}

                <button className="action-btn outline">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Popup Modal */}
      {chatOpen && activeChatDonation && (
        <div className="chat-overlay" onClick={closeChat}>
          <div className="chat-popup" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-info">
                <h3>💬 Chat: {activeChatDonation.foodType}</h3>
                <p>Coordinating with Green Valley NGO</p>
              </div>
              <button className="close-chat" onClick={closeChat}>
                ✕
              </button>
            </div>

            <div className="chat-messages">
              {(messages[activeChatDonation.id] || []).map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.type === "system" ? "system-message" : message.sender === "donor" ? "sent" : "received"}`}
                >
                  {message.type === "system" ? (
                    <div className="system-text">{message.text}</div>
                  ) : (
                    <>
                      <div className="message-content">
                        <span className="message-text">{message.text}</span>
                      </div>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="chat-input-area">
              <div className="quick-actions">
                <button 
                  className="quick-btn"
                  onClick={() => setQuickMessage("Food is ready for pickup!")}
                >
                  📦 Ready
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => setQuickMessage("Please use the back entrance")}
                >
                  🚪 Back Door
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => setQuickMessage("Running 10 minutes late")}
                >
                  ⏰ Delayed
                </button>
              </div>
              
              <div className="input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="chat-input"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <button 
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  📤
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDonations;