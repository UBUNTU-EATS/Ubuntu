import React, { useState } from "react";
import "../styles/AvailableDonations.css";

const AvailableDonations = ({ donations, onClaim }) => {
  const [filters, setFilters] = useState({
    category: "all",
    distance: "all",
    sortBy: "newest",
  });

  const [selectedDonation, setSelectedDonation] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const filteredDonations = donations.filter((donation) => {
    if (
      filters.category !== "all" &&
      donation.typeOfFood !== filters.category
    ) {
      return false;
    }
    return true;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (filters.sortBy === "quantity") {
      return parseInt(b.quantity) - parseInt(a.quantity);
    }
    return 0;
  });

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
    if (!expiryDate) return "normal";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "urgent";
    if (diffDays <= 3) return "warning";
    return "normal";
  };

  const handleQuickClaim = async (donationId) => {
    setClaiming(true);
    try {
      await onClaim(donationId);
      setSelectedDonation(null);
    } catch (error) {
      console.error("Error claiming donation:", error);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="available-donations">
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
            <option value="Fresh Meals">Fresh Meals</option>
            <option value="Baked Goods">Baked Goods</option>
            <option value="Fruits & Vegetables">Fruits & Vegetables</option>
            <option value="Dairy Products">Dairy Products</option>
            <option value="Packaged Food">Packaged Food</option>
            <option value="Beverages">Beverages</option>
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
            <option value="quantity">Largest Quantity</option>
          </select>
        </div>

        <div className="results-count">
          {sortedDonations.length} donation
          {sortedDonations.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Donations Grid */}
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
                  <h3>{donation.listingCompany || donation.donorName}</h3>
                </div>
                <div className="category-badge">
                  {getCategoryIcon(donation.typeOfFood)}
                  {donation.typeOfFood}
                </div>
              </div>

              <div className="card-content">
                <div className="food-details">
                  <h4>{donation.foodType}</h4>
                  <p className="quantity">
                    {donation.quantity} {donation.unit}
                  </p>
                </div>

                <div className="donation-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(donation.collectBy)}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">⏰ Expires:</span>
                    <span
                      className={`meta-value urgency-${getUrgencyColor(
                        donation.expiryDate
                      )}`}
                    >
                      {donation.expiryDate || "N/A"}
                      {getUrgencyColor(donation.expiryDate) === "urgent" &&
                        " ⚠️"}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">📍 Location:</span>
                    <span className="meta-value">
                      {donation.address || donation.location}
                    </span>
                  </div>

                  {donation.specialInstructions && (
                    <div className="meta-item">
                      <span className="meta-label">⚠️ Instructions:</span>
                      <span className="meta-value">
                        {donation.specialInstructions}
                      </span>
                    </div>
                  )}
                </div>

                {donation.imageURL && (
                  <div className="donation-image">
                    <img src={donation.imageURL} alt={donation.foodType} />
                  </div>
                )}

                <div className="donation-actions">
                  <button
                    className="quick-view-btn"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    Quick View
                  </button>
                  <button
                    className="claim-btn"
                    onClick={() => handleQuickClaim(donation.id)}
                    disabled={claiming}
                  >
                    {claiming ? "Claiming..." : "Claim Now"}
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
          className="modal-overlay"
          onClick={() => setSelectedDonation(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedDonation.listingCompany || selectedDonation.donorName}
              </h3>
              <button
                className="close-btn"
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

              <div className="modal-section">
                <h4>Food Details</h4>
                <div className="food-info">
                  <span className="food-type">{selectedDonation.foodType}</span>
                  <span className="food-quantity">
                    {selectedDonation.quantity} {selectedDonation.unit}
                  </span>
                  <span className="food-category">
                    {getCategoryIcon(selectedDonation.typeOfFood)}
                    {selectedDonation.typeOfFood}
                  </span>
                  {selectedDonation.listingDescription && (
                    <p className="food-description">
                      {selectedDonation.listingDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-section">
                <h4>Pickup Information</h4>
                <div className="pickup-info">
                  <div className="info-row">
                    <span className="label">📍 Location:</span>
                    <span className="value">
                      {selectedDonation.address || selectedDonation.location}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">📅 Pickup By:</span>
                    <span className="value">
                      {formatDate(selectedDonation.collectBy)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">⏰ Expires:</span>
                    <span
                      className={`value urgency-${getUrgencyColor(
                        selectedDonation.expiryDate
                      )}`}
                    >
                      {selectedDonation.expiryDate || "N/A"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">📞 Contact:</span>
                    <span className="value">
                      {selectedDonation.contactPerson} -{" "}
                      {selectedDonation.contactPhone}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDonation.specialInstructions && (
                <div className="modal-section">
                  <h4>Special Instructions</h4>
                  <p className="instructions">
                    {selectedDonation.specialInstructions}
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-cancel-btn"
                  onClick={() => setSelectedDonation(null)}
                >
                  Cancel
                </button>
                <button
                  className="modal-claim-btn"
                  onClick={() => handleQuickClaim(selectedDonation.id)}
                  disabled={claiming}
                >
                  {claiming ? "Claiming..." : "Claim This Donation"}
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
