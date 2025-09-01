import React, { useState } from "react";
import "../styles/MyDeliveries.css";

const MyDeliveries = ({ deliveries, onConfirmDelivery, onCancelDelivery }) => {
  const [activeFilter, setActiveFilter] = useState("CLAIMED");
  const [processing, setProcessing] = useState(null);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "CLAIMED":
        return "status-accepted";
      case "COLLECTED":
        return "status-delivered";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-accepted";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "CLAIMED":
        return "In Progress";
      case "COLLECTED":
        return "Delivered";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
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

  const getUrgencyColor = (expiryDate) => {
    if (!expiryDate) return "normal";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "urgent";
    if (diffDays <= 3) return "warning";
    return "normal";
  };

  const handleConfirmDelivery = async (claimId, listingId) => {
    setProcessing(claimId);
    try {
      await onConfirmDelivery(claimId, listingId);
    } catch (error) {
      console.error("Error confirming delivery:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelDelivery = async (claimId) => {
    setProcessing(claimId);
    try {
      await onCancelDelivery(claimId);
    } catch (error) {
      console.error("Error canceling delivery:", error);
    } finally {
      setProcessing(null);
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
          className={`filter-tab ${activeFilter === "CLAIMED" ? "active" : ""}`}
          onClick={() => setActiveFilter("CLAIMED")}
        >
          Active ({deliveries.filter((d) => d.status === "CLAIMED").length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "COLLECTED" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("COLLECTED")}
        >
          Completed ({deliveries.filter((d) => d.status === "COLLECTED").length}
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
            <div key={delivery.claimId} className="delivery-card">
              <div className="card-header">
                <div className="delivery-info">
                  <h3>{delivery.foodType}</h3>
                  <span className="accepted-date">
                    Accepted on {formatDate(delivery.volunteerAssignedAt)}
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
                    {getCategoryIcon(delivery.typeOfFood)}
                    {delivery.typeOfFood}
                  </div>
                </div>
              </div>

              <div className="card-content">
                <div className="delivery-details">
                  <div className="detail-item">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">
                      {delivery.listingCompany || delivery.donorName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">{delivery.ngoName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">
                      {delivery.quantity} {delivery.unit}
                    </span>
                  </div>
                </div>

                <div className="delivery-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(delivery.collectBy)}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">📍 Pickup Location:</span>
                    <span className="meta-value">
                      {delivery.address || delivery.location}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">🏠 Delivery Location:</span>
                    <span className="meta-value">
                      {delivery.ngoAddress || "Address not specified"}
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

                {delivery.status === "CLAIMED" && (
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

                {delivery.status === "COLLECTED" && delivery.collectedAt && (
                  <div className="delivery-completed">
                    <div className="completion-info">
                      <span className="completed-icon">✅</span>
                      <span className="completed-text">
                        Successfully delivered!
                      </span>
                      <span className="completion-date">
                        Delivered on {formatDate(delivery.collectedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {delivery.status === "CLAIMED" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() => handleCancelDelivery(delivery.claimId)}
                      disabled={processing === delivery.claimId}
                    >
                      {processing === delivery.claimId
                        ? "Canceling..."
                        : "Cancel Delivery"}
                    </button>
                    <button
                      className="action-btn primary"
                      onClick={() =>
                        handleConfirmDelivery(delivery.claimId, delivery.id)
                      }
                      disabled={processing === delivery.claimId}
                    >
                      {processing === delivery.claimId
                        ? "Confirming..."
                        : "Confirm Delivery"}
                    </button>
                  </>
                )}

                {delivery.status === "COLLECTED" && (
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
              {deliveries.filter((d) => d.status === "COLLECTED").length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDeliveries;
