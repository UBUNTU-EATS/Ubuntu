import React, { useState } from "react";
import "../styles/AvailableDeliveries.css";

const AvailableDeliveries = ({ deliveries, onAccept, maxDistance }) => {
  const [filters, setFilters] = useState({
    category: "all",
    urgency: "all",
    distance: "withinRange",
    sortBy: "urgency",
  });

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [processing, setProcessing] = useState(null);

  // Parse max distance (remove " km" and convert to number)
  const maxDistanceValue = parseInt(maxDistance);

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (
      filters.category !== "all" &&
      delivery.typeOfFood !== filters.category
    ) {
      return false;
    }

    if (filters.urgency !== "all") {
      const urgency = getUrgencyFromExpiry(delivery.expiryDate);
      if (urgency !== filters.urgency) return false;
    }

    if (filters.distance === "withinRange") {
      // You might need to calculate distance based on volunteer location
      // For now, we'll use a placeholder
      const deliveryDistance = 10; // Placeholder - implement geolocation
      if (deliveryDistance > maxDistanceValue) return false;
    }

    return true;
  });

  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    if (filters.sortBy === "urgency") {
      const urgencyOrder = { high: 1, medium: 2, low: 3 };
      const urgencyA = getUrgencyFromExpiry(a.expiryDate);
      const urgencyB = getUrgencyFromExpiry(b.expiryDate);
      return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
    } else if (filters.sortBy === "time") {
      return new Date(a.collectBy) - new Date(b.collectBy);
    }
    return 0;
  });

  const getUrgencyFromExpiry = (expiryDate) => {
    if (!expiryDate) return "medium";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "high";
    if (diffDays <= 3) return "medium";
    return "low";
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

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
    const urgency = getUrgencyFromExpiry(expiryDate);
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

  const getUrgencyText = (expiryDate) => {
    const urgency = getUrgencyFromExpiry(expiryDate);
    switch (urgency) {
      case "high":
        return "High Urgency";
      case "medium":
        return "Medium Urgency";
      case "low":
        return "Low Urgency";
      default:
        return "Normal";
    }
  };

  const handleQuickAccept = async (delivery) => {
    setProcessing(delivery.claimId);
    try {
      const success = await onAccept(
        delivery.claimId,
        delivery.listingId || delivery.id,
        delivery.ngoEmail,
        delivery.ngoName
      );

      if (success) {
        setSelectedDelivery(null);
        alert(
          "Delivery accepted successfully! It's now in your My Deliveries tab."
        );
      }
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert("Failed to accept delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="modern-available-deliveries">
      {/* Header Section */}
      <div className="donations-header">
        <div className="header-main">
          <h1>Available Deliveries</h1>
          <p>Help deliver food to those in need within your area</p>
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{deliveries.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {
                deliveries.filter(
                  (d) => getUrgencyFromExpiry(d.expiryDate) === "high"
                ).length
              }
            </span>
            <span className="stat-label">Urgent</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredDeliveries.length}</span>
            <span className="stat-label">Filtered</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
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
                <option value="Fresh Meals">Fresh Meals</option>
                <option value="Baked Goods">Baked Goods</option>
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="urgency">Urgency:</label>
              <select
                id="urgency"
                value={filters.urgency}
                onChange={(e) => handleFilterChange("urgency", e.target.value)}
              >
                <option value="all">All Urgency</option>
                <option value="high">High Urgency</option>
                <option value="medium">Medium Urgency</option>
                <option value="low">Low Urgency</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="distance">Distance:</label>
              <select
                id="distance"
                value={filters.distance}
                onChange={(e) => handleFilterChange("distance", e.target.value)}
              >
                <option value="withinRange">Within My Range</option>
                <option value="all">Any Distance</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortBy">Sort By:</label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="urgency">Urgency</option>
                <option value="time">Pickup Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="view-controls">
          <div className="max-distance-notice">
            Your maximum delivery distance: <strong>{maxDistance}</strong>
          </div>
          <div className="results-count">
            {sortedDeliveries.length} delivery
            {sortedDeliveries.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Deliveries Grid */}
      {sortedDeliveries.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">🚗</div>
          <h3>No deliveries available</h3>
          <p>Check back later for new delivery requests in your area</p>
        </div>
      ) : (
        <div className="donations-grid">
          {sortedDeliveries.map((delivery) => {
            const urgencyColor = getUrgencyColor(delivery.expiryDate);

            return (
              <div key={delivery.claimId} className="donation-item">
                {/* Content Section */}
                <div className="item-content">
                  <div className="content-header">
                    <div className="item-title">
                      <h3>{delivery.foodType}</h3>
                      <span className="item-quantity">
                        {delivery.quantity} {delivery.unit}
                      </span>
                    </div>

                    <div className="item-status">
                      <span
                        className="status-dot"
                        style={{
                          backgroundColor:
                            urgencyColor === "urgent"
                              ? "#dc3545"
                              : urgencyColor === "warning"
                              ? "#ffc107"
                              : "#28a745",
                        }}
                      ></span>
                      <span
                        className="status-text"
                        style={{
                          color:
                            urgencyColor === "urgent"
                              ? "#dc3545"
                              : urgencyColor === "warning"
                              ? "#d97706"
                              : "#059669",
                        }}
                      >
                        {getUrgencyText(delivery.expiryDate)}
                      </span>
                    </div>
                  </div>

                  <div className="content-details">
                    <div className="detail-row">
                      <span className="detail-icon">
                        {getCategoryIcon(delivery.typeOfFood)}
                      </span>
                      <span className="detail-text">{delivery.typeOfFood}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Pickup by {formatDate(delivery.collectBy)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📦</span>
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

                    {delivery.specialInstructions && (
                      <div className="detail-row">
                        <span className="detail-icon">⚠️</span>
                        <span className="detail-text">
                          {delivery.specialInstructions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Section */}
                <div className="item-actions">
                  <button
                    className="action-button outline"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    Details
                  </button>
                  <button
                    className="action-button primary"
                    onClick={() => handleQuickAccept(delivery)}
                    disabled={processing === delivery.claimId}
                  >
                    {processing === delivery.claimId
                      ? "Processing..."
                      : "Accept Delivery"}
                  </button>
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
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delivery Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedDelivery(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-details">
                <div className="detail-section">
                  <h4>Food Details</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Food Type:</strong>
                      <span>{selectedDelivery.foodType}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Quantity:</strong>
                      <span>
                        {selectedDelivery.quantity} {selectedDelivery.unit}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>
                        {getCategoryIcon(selectedDelivery.typeOfFood)}
                        {selectedDelivery.typeOfFood}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Delivery Route</h4>
                  <div className="detail-grid">
                    <div className="grid-item full-width">
                      <strong>Pickup From:</strong>
                      <span>
                        {selectedDelivery.listingCompany ||
                          selectedDelivery.donorName}
                      </span>
                      <span className="subtext">
                        {selectedDelivery.address || selectedDelivery.location}
                      </span>
                    </div>
                    <div className="grid-item full-width">
                      <strong>Deliver To:</strong>
                      <span>{selectedDelivery.ngoName}</span>
                      <span className="subtext">
                        {selectedDelivery.ngoAddress || "Address not specified"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Pickup By:</strong>
                      <span>{formatDate(selectedDelivery.collectBy)}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Urgency:</strong>
                      <span
                        style={{
                          color:
                            getUrgencyColor(selectedDelivery.expiryDate) ===
                            "urgent"
                              ? "#dc3545"
                              : getUrgencyColor(selectedDelivery.expiryDate) ===
                                "warning"
                              ? "#d97706"
                              : "#059669",
                        }}
                      >
                        {getUrgencyText(selectedDelivery.expiryDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedDelivery.specialInstructions && (
                  <div className="detail-section">
                    <h4>Special Instructions</h4>
                    <p className="instruction-text">
                      {selectedDelivery.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button secondary"
                onClick={() => setSelectedDelivery(null)}
              >
                Cancel
              </button>
              <button
                className="modal-button primary"
                onClick={() => handleQuickAccept(selectedDelivery)}
                disabled={processing === selectedDelivery.claimId}
              >
                {processing === selectedDelivery.claimId
                  ? "Processing..."
                  : "Accept This Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableDeliveries;
