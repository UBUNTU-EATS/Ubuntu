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

  // Parse max distance (remove " km" and convert to number)
  const maxDistanceValue = parseInt(maxDistance);

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filters.category !== "all" && delivery.category !== filters.category) {
      return false;
    }

    if (filters.urgency !== "all" && delivery.urgency !== filters.urgency) {
      return false;
    }

    if (filters.distance === "withinRange") {
      const deliveryDistance = parseFloat(delivery.distance);
      if (deliveryDistance > maxDistanceValue) return false;
    }

    return true;
  });

  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    if (filters.sortBy === "urgency") {
      const urgencyOrder = { high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    } else if (filters.sortBy === "distance") {
      return parseFloat(a.distance) - parseFloat(b.distance);
    } else if (filters.sortBy === "time") {
      return new Date(a.pickupTime) - new Date(b.pickupTime);
    }
    return 0;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const formatDate = (dateString) => {
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

  const getUrgencyText = (urgency) => {
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

  const handleQuickAccept = (deliveryId) => {
    onAccept(deliveryId);
    setSelectedDelivery(null);
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
            <option value="fresh-meals">Fresh Meals</option>
            <option value="bakery">Bakery Items</option>
            <option value="fruits-vegetables">Fruits & Vegetables</option>
            <option value="dairy">Dairy Products</option>
            <option value="packaged-goods">Packaged Goods</option>
            <option value="beverages">Beverages</option>
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
            <option value="distance">Distance</option>
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
            <div key={delivery.id} className="delivery-card">
              <div className="card-header">
                <div className="urgency-badge">
                  <span
                    className={`urgency-dot ${getUrgencyColor(
                      delivery.urgency
                    )}`}
                  ></span>
                  {getUrgencyText(delivery.urgency)}
                </div>
                <div className="category-badge">
                  {getCategoryIcon(delivery.category)}
                  {delivery.category.replace("-", " ")}
                </div>
              </div>

              <div className="card-content">
                <div className="delivery-details">
                  <h3>{delivery.foodType}</h3>
                  <p className="quantity">{delivery.quantity}</p>
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
                        {delivery.donorName}
                      </span>
                      <span className="location-address">
                        {delivery.pickupLocation}
                      </span>
                    </div>

                    <div className="location-item">
                      <span className="location-label">To:</span>
                      <span className="location-value">
                        {delivery.recipientName}
                      </span>
                      <span className="location-address">
                        {delivery.deliveryLocation}
                      </span>
                    </div>
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
                    <span className="meta-label">📏 Distance:</span>
                    <span className="meta-value">{delivery.distance} km</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">⏱️ Est. Time:</span>
                    <span className="meta-value">
                      ~{Math.round(parseFloat(delivery.distance) * 2)} min
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
                    onClick={() => handleQuickAccept(delivery.id)}
                  >
                    Accept Delivery
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
                    {selectedDelivery.quantity}
                  </span>
                  <span className="food-category">
                    {getCategoryIcon(selectedDelivery.category)}
                    {selectedDelivery.category.replace("-", " ")}
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
                      <p className="point-name">{selectedDelivery.donorName}</p>
                      <p className="point-address">
                        {selectedDelivery.pickupLocation}
                      </p>
                    </div>
                  </div>

                  <div className="route-divider">
                    <div className="divider-line"></div>
                    <div className="distance-badge">
                      {selectedDelivery.distance} km
                    </div>
                  </div>

                  <div className="route-point">
                    <div className="point-header">
                      <span className="point-icon">🏠</span>
                      <span className="point-title">Delivery Location</span>
                    </div>
                    <div className="point-details">
                      <p className="point-name">
                        {selectedDelivery.recipientName}
                      </p>
                      <p className="point-address">
                        {selectedDelivery.deliveryLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>Delivery Information</h4>
                <div className="delivery-info-grid">
                  <div className="info-item">
                    <span className="info-label">📅 Pickup Time:</span>
                    <span className="info-value">
                      {formatDate(selectedDelivery.pickupTime)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📏 Distance:</span>
                    <span className="info-value">
                      {selectedDelivery.distance} km
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">⏱️ Est. Time:</span>
                    <span className="info-value">
                      ~{Math.round(parseFloat(selectedDelivery.distance) * 2)}{" "}
                      minutes
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🚨 Urgency:</span>
                    <span
                      className={`info-value urgency-${getUrgencyColor(
                        selectedDelivery.urgency
                      )}`}
                    >
                      {getUrgencyText(selectedDelivery.urgency)}
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
                  onClick={() => handleQuickAccept(selectedDelivery.id)}
                >
                  Accept This Delivery
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
