import React, { useState } from "react";
import "../styles/AvailableDonations.css";

const AvailableDonations = ({ donations = [], onClaim }) => {
  const [filters, setFilters] = useState({
    category: "all",
    distance: "all",
    sortBy: "newest",
  });
  const [selectedDonation, setSelectedDonation] = useState(null);

  // 🧹 Filtering
  const filteredDonations = donations.filter((donation) => {
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
      case "fresh-meals": return "🍽️";
      case "bakery": return "🥐";
      case "fruits-vegetables": return "🥦";
      case "dairy": return "🥛";
      case "packaged-goods": return "📦";
      case "beverages": return "🥤";
      default: return "📦";
    }
  };

  const getUrgencyColor = (expiryDate) => {
    if (!expiryDate) return "normal";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "urgent";
    if (diffDays <= 3) return "warning";
    return "normal";
  };

  const handleQuickClaim = (donationId) => {
    if (onClaim) onClaim(donationId);
    setSelectedDonation(null);
  };

  return (
    <div className="available-donations">
      {/* Header */}
      <div className="section-header">
        <h2>Available Donations</h2>
        <p>Claim food donations to distribute to those in need</p>
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

        <div className="results-count">
          {sortedDonations.length} donation
          {sortedDonations.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Donations List */}
      {sortedDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No donations available</h3>
          <p>Check back later for new food donations in your area</p>
        </div>
      ) : (
        <div className="donations-grid">
          {sortedDonations.map((donation) => (
            <div key={donation.id} className="donation-card">
              <div className="card-header">
                <div className="donor-info">
                  <h3>{donation.donorName || "Anonymous Donor"}</h3>
                  <span className="distance">{donation.distance || "N/A"} km away</span>
                </div>
                <div className="category-badge">
                  {getCategoryIcon(donation.category)}
                  {donation.category
                    ? donation.category.replace("-", " ")
                    : "Uncategorized"}
                </div>
              </div>

              <div className="card-content">
                <div className="food-details">
                  <h4>{donation.foodType || "Unknown Food"}</h4>
                  <p className="quantity">{donation.quantity || "N/A"}</p>
                </div>

                <div className="donation-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">{formatDate(donation.pickupTime)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">⏰ Expires:</span>
                    <span
                      className={`meta-value urgency-${getUrgencyColor(
                        donation.expiryDate
                      )}`}
                    >
                      {donation.expiryDate
                        ? new Date(donation.expiryDate).toLocaleDateString()
                        : "N/A"}
                      {getUrgencyColor(donation.expiryDate) === "urgent" && " ⚠️"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Location:</span>
                    <span className="meta-value">{donation.location || "Unknown"}</span>
                  </div>
                  {donation.specialInstructions && (
                    <div className="meta-item">
                      <span className="meta-label">⚠️ Instructions:</span>
                      <span className="meta-value">{donation.specialInstructions}</span>
                    </div>
                  )}
                </div>

                <div className="donation-actions">
                  <button className="quick-view-btn" onClick={() => setSelectedDonation(donation)}>
                    Quick View
                  </button>
                  <button className="claim-btn" onClick={() => handleQuickClaim(donation.id)}>
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
        <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDonation.donorName || "Anonymous Donor"}</h3>
              <button className="close-btn" onClick={() => setSelectedDonation(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>Food Details</h4>
                <div className="food-info">
                  <span className="food-type">{selectedDonation.foodType || "Unknown"}</span>
                  <span className="food-quantity">{selectedDonation.quantity || "N/A"}</span>
                  <span className="food-category">
                    {getCategoryIcon(selectedDonation.category)}
                    {selectedDonation.category
                      ? selectedDonation.category.replace("-", " ")
                      : "Uncategorized"}
                  </span>
                </div>
              </div>

              <div className="modal-section">
                <h4>Pickup Information</h4>
                <div className="pickup-info">
                  <div className="info-row">
                    <span className="label">📍 Location:</span>
                    <span className="value">{selectedDonation.location || "Unknown"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📅 Pickup By:</span>
                    <span className="value">{formatDate(selectedDonation.pickupTime)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">⏰ Expires:</span>
                    <span className={`value urgency-${getUrgencyColor(selectedDonation.expiryDate)}`}>
                      {selectedDonation.expiryDate
                        ? new Date(selectedDonation.expiryDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">📏 Distance:</span>
                    <span className="value">{selectedDonation.distance || "N/A"} km away</span>
                  </div>
                </div>
              </div>

              {selectedDonation.specialInstructions && (
                <div className="modal-section">
                  <h4>Special Instructions</h4>
                  <p className="instructions">{selectedDonation.specialInstructions}</p>
                </div>
              )}

              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setSelectedDonation(null)}>
                  Cancel
                </button>
                <button className="modal-claim-btn" onClick={() => handleQuickClaim(selectedDonation.id)}>
                  Claim This Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableDonations;
