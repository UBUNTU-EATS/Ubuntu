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

  const handleQuickAccept = async (claimId) => {
    setProcessing(claimId);
    try {
      await onAccept(claimId);
      setSelectedDelivery(null);
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert("Failed to accept delivery. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="available-deliveries">
      <div className="section-header">
        <h2>Available Deliveries</h2>
        <p>Help deliver food to those in need within your area</p>
        <div className="max-distance-notice">
          Your maximum delivery distance: <strong>{maxDistance}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
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

        <div className="results-count">
          {sortedDeliveries.length} delivery
          {sortedDeliveries.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Deliveries Grid */}
      {sortedDeliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No deliveries available</h3>
          <p>Check back later for new delivery requests in your area</p>
        </div>
      ) : (
        <div className="deliveries-grid">
          {sortedDeliveries.map((delivery) => (
            <div key={delivery.claimId} className="delivery-card">
              <div className="card-header">
                <div className="urgency-badge">
                  <span
                    className={`urgency-dot ${getUrgencyColor(
                      delivery.expiryDate
                    )}`}
                  ></span>
                  {getUrgencyText(delivery.expiryDate)}
                </div>
                <div className="category-badge">
                  {getCategoryIcon(delivery.typeOfFood)}
                  {delivery.typeOfFood}
                </div>
              </div>

              <div className="card-content">
                <div className="delivery-details">
                  <h3>{delivery.foodType}</h3>
                  <p className="quantity">
                    {delivery.quantity} {delivery.unit}
                  </p>
                </div>

                <div className="route-info">
                  <div className="route-line">
                    <div className="location-point pickup">
                      <span className="point-icon">📦</span>
                      <span className="point-label">Pickup</span>
                    </div>
                    <div className="route-dots">• • • • • • • • • •</div>
                    <div className="location-point delivery">
                      <span className="point-icon">🏠</span>
                      <span className="point-label">Delivery</span>
                    </div>
                  </div>

                  <div className="location-details">
                    <div className="location-item">
                      <span className="location-label">From:</span>
                      <span className="location-value">
                        {delivery.listingCompany || delivery.donorName}
                      </span>
                      <span className="location-address">
                        {delivery.address || delivery.location}
                      </span>
                    </div>

                    <div className="location-item">
                      <span className="location-label">To:</span>
                      <span className="location-value">{delivery.ngoName}</span>
                      <span className="location-address">
                        {delivery.ngoAddress || "Address not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="delivery-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(delivery.collectBy)}
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

                <div className="delivery-actions">
                  <button
                    className="quick-view-btn"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    View Details
                  </button>
                  <button
                    className="accept-btn"
                    onClick={() => handleQuickAccept(delivery.claimId)}
                    disabled={processing === delivery.claimId}
                  >
                    {processing === delivery.claimId
                      ? "Processing..."
                      : "Accept Delivery"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedDelivery && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDelivery(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delivery Details</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedDelivery(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h4>Food Details</h4>
                <div className="food-info">
                  <span className="food-type">{selectedDelivery.foodType}</span>
                  <span className="food-quantity">
                    {selectedDelivery.quantity} {selectedDelivery.unit}
                  </span>
                  <span className="food-category">
                    {getCategoryIcon(selectedDelivery.typeOfFood)}
                    {selectedDelivery.typeOfFood}
                  </span>
                </div>
              </div>

              <div className="modal-section">
                <h4>Delivery Route</h4>
                <div className="route-details">
                  <div className="route-point">
                    <div className="point-header">
                      <span className="point-icon">📦</span>
                      <span className="point-title">Pickup Location</span>
                    </div>
                    <div className="point-details">
                      <p className="point-name">
                        {selectedDelivery.listingCompany ||
                          selectedDelivery.donorName}
                      </p>
                      <p className="point-address">
                        {selectedDelivery.address || selectedDelivery.location}
                      </p>
                    </div>
                  </div>

                  <div className="route-divider">
                    <div className="divider-line"></div>
                    <div className="distance-badge">
                      {/* You might want to calculate actual distance here */}
                      ~10 km
                    </div>
                  </div>

                  <div className="route-point">
                    <div className="point-header">
                      <span className="point-icon">🏠</span>
                      <span className="point-title">Delivery Location</span>
                    </div>
                    <div className="point-details">
                      <p className="point-name">{selectedDelivery.ngoName}</p>
                      <p className="point-address">
                        {selectedDelivery.ngoAddress || "Address not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>Delivery Information</h4>
                <div className="delivery-info-grid">
                  <div className="info-item">
                    <span className="info-label">📅 Pickup By:</span>
                    <span className="info-value">
                      {formatDate(selectedDelivery.collectBy)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🚨 Urgency:</span>
                    <span
                      className={`info-value urgency-${getUrgencyColor(
                        selectedDelivery.expiryDate
                      )}`}
                    >
                      {getUrgencyText(selectedDelivery.expiryDate)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDelivery.specialInstructions && (
                <div className="modal-section">
                  <h4>Special Instructions</h4>
                  <p className="instructions">
                    {selectedDelivery.specialInstructions}
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-cancel-btn"
                  onClick={() => setSelectedDelivery(null)}
                >
                  Cancel
                </button>
                <button
                  className="modal-accept-btn"
                  onClick={() => handleQuickAccept(selectedDelivery.claimId)}
                  disabled={processing === selectedDelivery.claimId}
                >
                  {processing === selectedDelivery.claimId
                    ? "Processing..."
                    : "Accept This Delivery"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableDeliveries;
