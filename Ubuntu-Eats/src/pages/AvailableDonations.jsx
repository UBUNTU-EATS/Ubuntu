import React, { useState } from "react";
import "../styles/AvailableDonations.css";

const AvailableDonations = ({ donations = [], onClaim }) => {
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
    if (!expiryDate) return "#059669";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "#dc2626"; // red
    if (diffDays <= 3) return "#d97706"; // orange
    return "#059669"; // green
  };

  const handleQuickClaim = (donationId) => {
    if (onClaim) onClaim(donationId);
    setSelectedDonation(null);
  };

  const handleClaimWithMethod = (method) => {
    if (donationToClaim && onClaim) {
      onClaim(donationToClaim, method);
      setShowCollectionMethodModal(false);
      setSelectedDonation(null);
    }
  };

  const handleClaimClick = (donationId) => {
    setDonationToClaim(donationId);
    setShowCollectionMethodModal(true);
  };

  return (
    <div className="modern-available-donations">
      {/* Filters */}
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
                <option value="fruits-vegetables">
                  Fruits & Vegetables
                </option>
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
              ▦
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              ☰
            </button>
          </div>
          <div className="results-count">
            {sortedDonations.length} donation
            {sortedDonations.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Donation Cards */}
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
            <div key={donation.id} className="donation-card">
              {donation.imageURL && (
                <div className="item-image">
                  <img src={donation.imageURL} alt={donation.foodType} />
                </div>
              )}
              <div className="card-content">
                <h4>{donation.foodType}</h4>
                <p>{donation.quantity}</p>
                <p>{donation.location}</p>
                <p>{formatDate(donation.pickupTime)}</p>
                <button
                  className="action-button"
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
                <img
                  src={selectedDonation.imageURL}
                  alt={selectedDonation.foodType}
                />
              )}
              <p>Quantity: {selectedDonation.quantity}</p>
              <p>Location: {selectedDonation.location}</p>
              <p>Pickup By: {formatDate(selectedDonation.pickupTime)}</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedDonation(null)}>Cancel</button>
              <button onClick={() => handleClaimClick(selectedDonation.id)}>
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
              <button onClick={() => handleClaimWithMethod("self")}>
                🚗 Self Collection
              </button>
              <button onClick={() => handleClaimWithMethod("volunteer")}>
                🤝 Volunteer Assistance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableDonations;
