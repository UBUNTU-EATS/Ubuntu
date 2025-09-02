import React, { useState } from "react";
import "../styles/AvailableDonations.css";

const AvailableDonations = ({ donations, onClaim }) => {
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

  const filteredDonations = donations.filter((donation) => {
    if (filters.category !== "all" && donation.category !== filters.category) {
      return false;
    }

    if (filters.distance !== "all") {
      const distance = parseFloat(donation.distance);
      if (filters.distance === "under5" && distance > 5) return false;
      if (filters.distance === "5to10" && (distance <= 5 || distance > 10))
        return false;
      if (filters.distance === "over10" && distance <= 10) return false;
    }

    return true;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.pickupTime) - new Date(a.pickupTime);
    } else if (filters.sortBy === "closest") {
      return parseFloat(a.distance) - parseFloat(b.distance);
    } else if (filters.sortBy === "quantity") {
      return parseFloat(b.quantity) - parseFloat(a.quantity);
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

  const getCategoryLabel = (category) => {
    if (!category) return "Unknown";
    return category.replace(/-/g, " ");
  };

  const getUrgencyColor = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "#dc2626";
    if (diffDays <= 3) return "#d97706";
    return "#059669";
  };

  const handleClaimWithMethod = (method) => {
    if (donationToClaim) {
      onClaim(donationToClaim, method);
      setShowCollectionMethodModal(false);
      setSelectedDonation(null);
    }
  };

  const handleClaimClick = (donationId) => {
    setDonationToClaim(donationId);
    setShowCollectionMethodModal(true);
  };

  // Calculate statistics for header
  const totalDonations = donations.length;
  const nearbyDonations = donations.filter(
    (d) => parseFloat(d.distance) <= 5
  ).length;
  const urgentDonations = donations.filter((d) => {
    const expiry = new Date(d.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  }).length;

  return (
    <div className="modern-available-donations">
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

          <div className="results-count">
            {sortedDonations.length} donation
            {sortedDonations.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Donations Grid */}
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
          {sortedDonations.map((donation) => (
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
                    <h3>{donation.donorName}</h3>
                    <span className="item-distance">
                      {donation.distance} km away
                    </span>
                  </div>

                  <div className="category-badge">
                    {getCategoryIcon(donation.category)}
                    {getCategoryLabel(donation.category)}
                  </div>
                </div>

                <div className="content-details">
                  <div className="food-details">
                    <h4>{donation.foodType}</h4>
                    <span className="item-quantity">{donation.quantity}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      Pickup by {formatDate(donation.pickupTime)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <span
                      className="detail-text"
                      style={{ color: getUrgencyColor(donation.expiryDate) }}
                    >
                      Expires{" "}
                      {new Date(donation.expiryDate).toLocaleDateString()}
                      {getUrgencyColor(donation.expiryDate) === "#dc2626" &&
                        " ⚠️"}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{donation.location}</span>
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

                {/* Action Section */}
                <div className="item-actions">
                  <button
                    className="action-button outline"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    Details
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
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedDonation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDonation(null)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDonation.donorName}</h2>
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
                      <span>{selectedDonation.quantity}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>
                        {getCategoryIcon(selectedDonation.category)}
                        {getCategoryLabel(selectedDonation.category)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Pickup Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item full-width">
                      <strong>Location:</strong>
                      <span>{selectedDonation.location}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Distance:</strong>
                      <span>{selectedDonation.distance} km away</span>
                    </div>
                    <div className="grid-item">
                      <strong>Pickup By:</strong>
                      <span>{formatDate(selectedDonation.pickupTime)}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Expires:</strong>
                      <span
                        style={{
                          color: getUrgencyColor(selectedDonation.expiryDate),
                        }}
                      >
                        {new Date(
                          selectedDonation.expiryDate
                        ).toLocaleDateString()}
                      </span>
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
                <div className="method-option">
                  <div className="method-icon">🚗</div>
                  <h4>Self Collection</h4>
                  <p>You will collect the donation yourself</p>
                  <button
                    className="modal-button primary"
                    onClick={() => handleClaimWithMethod("self")}
                  >
                    Select Self Collection
                  </button>
                </div>

                <div className="method-option">
                  <div className="method-icon">🤝</div>
                  <h4>Volunteer Assistance</h4>
                  <p>Request a volunteer to help collect the donation</p>
                  <button
                    className="modal-button primary"
                    onClick={() => handleClaimWithMethod("volunteer")}
                  >
                    Request Volunteer
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
