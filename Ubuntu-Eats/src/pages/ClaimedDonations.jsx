import React, { useState } from "react";
import "../styles/ClaimedDonations.css";

const ClaimedDonations = ({
  donations,
  onSetCollectionMethod,
  onConfirmCollection,
  onCancelClaim,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredDonations = donations.filter((donation) => {
    if (activeFilter === "all") return true;
    return donation.status === activeFilter;
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
      case "claimed":
        return "status-claimed";
      case "collected":
        return "status-collected";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-claimed";
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

  return (
    <div className="claimed-donations">
      <div className="section-header">
        <h2>My Claimed Donations</h2>
        <p>Manage your claimed food donations and collection process</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Claims ({donations.length})
        </button>
        <button
          className={`filter-tab ${activeFilter === "claimed" ? "active" : ""}`}
          onClick={() => setActiveFilter("claimed")}
        >
          To Collect ({donations.filter((d) => d.status === "claimed").length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "collected" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("collected")}
        >
          Collected ({donations.filter((d) => d.status === "collected").length})
        </button>
      </div>

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No claimed donations</h3>
          <p>
            You haven't claimed any donations yet. Browse available donations to
            get started.
          </p>
        </div>
      ) : (
        <div className="claimed-list">
          {filteredDonations.map((donation) => (
            <div key={donation.id} className="claimed-card">
              <div className="card-header">
                <div className="donor-info">
                  <h3>{donation.donorName}</h3>
                  <span className="claim-date">
                    Claimed on {formatDate(donation.claimDate)}
                  </span>
                </div>
                <div className="status-section">
                  <span
                    className={`status-badge ${getStatusColor(
                      donation.status
                    )}`}
                  >
                    {donation.status.charAt(0).toUpperCase() +
                      donation.status.slice(1)}
                  </span>
                  <div className="category-badge">
                    {getCategoryIcon(donation.category)}
                    {donation.category.replace("-", " ")}
                  </div>
                </div>
              </div>

              <div className="card-content">
                <div className="food-details">
                  <h4>{donation.foodType}</h4>
                  <p className="quantity">{donation.quantity}</p>
                </div>

                <div className="donation-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(donation.pickupTime)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Location:</span>
                    <span className="meta-value">{donation.location}</span>
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

                {donation.status === "claimed" && (
                  <div className="collection-method">
                    <h4>Collection Method</h4>
                    <div className="method-options">
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "self" ? "active" : ""
                        }`}
                        onClick={() =>
                          onSetCollectionMethod(donation.id, "self")
                        }
                      >
                        🚗 Self Collection
                      </button>
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "volunteer"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          onSetCollectionMethod(donation.id, "volunteer")
                        }
                      >
                        🤝 Volunteer Assistance
                      </button>
                    </div>
                  </div>
                )}

                {donation.collectionMethod === "volunteer" &&
                  donation.status === "claimed" && (
                    <div className="volunteer-info">
                      <div className="volunteer-assigned">
                        <span className="waiting-text">
                          ⏳ Waiting for volunteer assignment...
                        </span>
                      </div>
                    </div>
                  )}

                {donation.collectionMethod === "self" &&
                  donation.status === "claimed" && (
                    <div className="collection-instructions">
                      <p>
                        Please collect the donation at the scheduled time. Don't
                        forget to confirm collection when you receive it.
                      </p>
                    </div>
                  )}
              </div>

              <div className="card-actions">
                {donation.status === "claimed" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() => onCancelClaim(donation.id)}
                    >
                      Cancel Claim
                    </button>
                    {donation.collectionMethod === "self" && (
                      <button
                        className="action-btn primary"
                        onClick={() => onConfirmCollection(donation.id)}
                      >
                        Confirm Collection
                      </button>
                    )}
                  </>
                )}

                {donation.status === "collected" && (
                  <div className="completion-info">
                    <span className="completed-text">
                      ✅ Successfully collected!
                    </span>
                    <span className="completion-date">
                      Collected on{" "}
                      {formatDate(
                        donation.collectionDate || new Date().toISOString()
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimedDonations;
