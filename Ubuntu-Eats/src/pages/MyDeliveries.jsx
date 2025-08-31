import React, { useState } from "react";
import "../styles/MyDeliveries.css";

const MyDeliveries = ({ deliveries, onConfirmDelivery, onCancelDelivery }) => {
  const [activeFilter, setActiveFilter] = useState("active");

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (activeFilter === "all") return true;
    return delivery.status === activeFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "status-accepted";
      case "delivered":
        return "status-delivered";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-accepted";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "In Progress";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "urgent";
      case "medium":
        return "warning";
      case "low":
        return "normal";
      default:
        return "normal";
    }
  };

  return (
    <div className="my-deliveries">
      <div className="section-header">
        <h2>My Deliveries</h2>
        <p>Manage your accepted food deliveries</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Deliveries ({deliveries.length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "accepted" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("accepted")}
        >
          Active ({deliveries.filter((d) => d.status === "accepted").length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "delivered" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("delivered")}
        >
          Completed ({deliveries.filter((d) => d.status === "delivered").length}
          )
        </button>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No deliveries found</h3>
          <p>
            {activeFilter === "all"
              ? "You haven't accepted any deliveries yet. Check available deliveries to get started."
              : `No deliveries with status "${getStatusText(
                  activeFilter
                )}" found.`}
          </p>
        </div>
      ) : (
        <div className="deliveries-list">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="delivery-card">
              <div className="card-header">
                <div className="delivery-info">
                  <h3>{delivery.foodType}</h3>
                  <span className="accepted-date">
                    Accepted on {formatDate(delivery.acceptedAt)}
                  </span>
                </div>
                <div className="status-section">
                  <span
                    className={`status-badge ${getStatusColor(
                      delivery.status
                    )}`}
                  >
                    {getStatusText(delivery.status)}
                  </span>
                  <div className="category-badge">
                    {getCategoryIcon(delivery.category)}
                    {delivery.category.replace("-", " ")}
                  </div>
                </div>
              </div>

              <div className="card-content">
                <div className="delivery-details">
                  <div className="detail-item">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">{delivery.donorName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">
                      {delivery.recipientName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{delivery.quantity}</span>
                  </div>
                </div>

                <div className="delivery-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup Time:</span>
                    <span className="meta-value">
                      {formatDate(delivery.pickupTime)}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">📍 Pickup Location:</span>
                    <span className="meta-value">
                      {delivery.pickupLocation}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">🏠 Delivery Location:</span>
                    <span className="meta-value">
                      {delivery.deliveryLocation}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">📏 Distance:</span>
                    <span className="meta-value">{delivery.distance} km</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">⏱️ Est. Time:</span>
                    <span className="meta-value">
                      {delivery.estimatedDeliveryTime}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">🚨 Urgency:</span>
                    <span
                      className={`meta-value urgency-${getUrgencyColor(
                        delivery.urgency
                      )}`}
                    >
                      {delivery.urgency.charAt(0).toUpperCase() +
                        delivery.urgency.slice(1)}
                    </span>
                  </div>

                  {delivery.specialInstructions && (
                    <div className="meta-item">
                      <span className="meta-label">⚠️ Instructions:</span>
                      <span className="meta-value">
                        {delivery.specialInstructions}
                      </span>
                    </div>
                  )}
                </div>

                {delivery.status === "accepted" && (
                  <div className="delivery-progress">
                    <div className="progress-steps">
                      <div className="progress-step active">
                        <span className="step-number">1</span>
                        <span className="step-label">Accepted</span>
                      </div>
                      <div className="progress-connector"></div>
                      <div className="progress-step">
                        <span className="step-number">2</span>
                        <span className="step-label">Picked Up</span>
                      </div>
                      <div className="progress-connector"></div>
                      <div className="progress-step">
                        <span className="step-number">3</span>
                        <span className="step-label">Delivered</span>
                      </div>
                    </div>
                  </div>
                )}

                {delivery.status === "delivered" && delivery.deliveredAt && (
                  <div className="delivery-completed">
                    <div className="completion-info">
                      <span className="completed-icon">✅</span>
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

              <div className="card-actions">
                {delivery.status === "accepted" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() => onCancelDelivery(delivery.id)}
                    >
                      Cancel Delivery
                    </button>
                    <button
                      className="action-btn primary"
                      onClick={() => onConfirmDelivery(delivery.id)}
                    >
                      Confirm Delivery
                    </button>
                  </>
                )}

                {delivery.status === "delivered" && (
                  <div className="completion-actions">
                    <button className="action-btn outline">View Details</button>
                    <button className="action-btn outline">
                      Share Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="stats-summary">
        <h3>Delivery Summary</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{deliveries.length}</span>
            <span className="stat-label">Total Deliveries</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {deliveries.filter((d) => d.status === "delivered").length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {deliveries
                .reduce(
                  (total, delivery) => total + parseFloat(delivery.distance),
                  0
                )
                .toFixed(1)}{" "}
              km
            </span>
            <span className="stat-label">Total Distance</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {Math.round(
                deliveries.reduce(
                  (total, delivery) => total + parseFloat(delivery.distance),
                  0
                ) * 2
              )}{" "}
              min
            </span>
            <span className="stat-label">Total Time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDeliveries;
