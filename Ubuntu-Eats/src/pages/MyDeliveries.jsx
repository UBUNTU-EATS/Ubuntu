import React, { useState } from "react";
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

  const handleConfirmDelivery = async (deliveryId, claimId, listingId) => {
    setProcessing(deliveryId);
    try {
      await onConfirmDelivery(deliveryId, claimId, listingId);
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Failed to confirm delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelDelivery = async (deliveryId, claimId) => {
    setProcessing(deliveryId);
    try {
      await onCancelDelivery(deliveryId, claimId);
    } catch (error) {
      console.error("Error canceling delivery:", error);
      alert("Failed to cancel delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteDelivery = async (deliveryId, claimId, listingId) => {
    setProcessing(deliveryId);
    try {
      await onCompleteDelivery(deliveryId, claimId, listingId);
    } catch (error) {
      console.error("Error completing delivery:", error);
      alert("Failed to complete delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenChat = (delivery) => {
    if (onOpenChat) {
      onOpenChat(delivery);
    }
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
                        onClick={() =>
                          handleCancelDelivery(
                            delivery.deliveryId,
                            delivery.claimId
                          )
                        }
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
                      onClick={() =>
                        handleCompleteDelivery(
                          delivery.deliveryId,
                          delivery.claimId,
                          delivery.listingId
                        )
                      }
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

      {/* Details Modal */}
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
              {(selectedDelivery.status === "ASSIGNED" ||
                selectedDelivery.status === "PICKED_UP") && (
                <button
                  className="modal-btn chat"
                  onClick={() => {
                    handleOpenChat(selectedDelivery);
                    setSelectedDelivery(null);
                  }}
                >
                  💬 Chat with NGO
                </button>
              )}
              <button
                className="modal-btn secondary"
                onClick={() => setSelectedDelivery(null)}
              >
                Close
              </button>
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
