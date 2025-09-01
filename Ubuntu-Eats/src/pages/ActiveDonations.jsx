import React, { useState } from "react";
import "../styles/ActveDonations.css";
const ActiveDonations = ({ donations, setDonations }) => {
  const [filter, setFilter] = useState("all");

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Pickup":
        return "status-pending";
      case "In Transit":
        return "status-transit";
      case "Completed":
        return "status-completed";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const updateStatus = (donationId, newStatus) => {
    setDonations((prev) =>
      prev.map((donation) =>
        donation.id === donationId
          ? { ...donation, status: newStatus }
          : donation
      )
    );
  };

  const filteredDonations = donations.filter((donation) => {
    if (filter === "all") return true;
    return donation.status.toLowerCase().replace(" ", "-") === filter;
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

  return (
    <div className="active-donations">
      <div className="donations-header">
        <h2>Active Donations</h2>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({donations.length})
          </button>
          <button
            className={`filter-tab ${
              filter === "pending-pickup" ? "active" : ""
            }`}
            onClick={() => setFilter("pending-pickup")}
          >
            Pending (
            {donations.filter((d) => d.status === "Pending Pickup").length})
          </button>
          <button
            className={`filter-tab ${filter === "in-transit" ? "active" : ""}`}
            onClick={() => setFilter("in-transit")}
          >
            In Transit (
            {donations.filter((d) => d.status === "In Transit").length})
          </button>
          <button
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed (
            {donations.filter((d) => d.status === "Completed").length})
          </button>
        </div>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No donations found</h3>
          <p>
            {filter === "all"
              ? "You haven't made any donations yet. Start by clicking the 'Donate Food' tab."
              : `No donations with status "${filter.replace("-", " ")}" found.`}
          </p>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map((donation) => (
            <div key={donation.id} className="donation-card">
              <div className="card-header">
                <div className="donation-info">
                  <h3>{donation.foodType}</h3>
                  <p className="donation-quantity">{donation.quantity}</p>
                </div>
                <span
                  className={`status-badge ${getStatusColor(donation.status)}`}
                >
                  {donation.status}
                </span>
              </div>

              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">📅 Scheduled:</span>
                  <span className="info-value">
                    {formatDate(donation.scheduledTime)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">📍 Location:</span>
                  <span className="info-value">{donation.location}</span>
                </div>

                {donation.description && (
                  <div className="info-row">
                    <span className="info-label">📝 Description:</span>
                    <span className="info-value">{donation.description}</span>
                  </div>
                )}

                {donation.specialInstructions && (
                  <div className="info-row">
                    <span className="info-label">⚠️ Instructions:</span>
                    <span className="info-value">
                      {donation.specialInstructions}
                    </span>
                  </div>
                )}

                {donation.images && donation.images.length > 0 && (
                  <div className="donation-images">
                    <span className="info-label">🖼️ Images:</span>
                    <div className="images-thumbnails">
                      {donation.images.slice(0, 3).map((image) => (
                        <img
                          key={image.id}
                          src={image.url}
                          alt={image.name}
                          className="image-thumbnail"
                        />
                      ))}
                      {donation.images.length > 3 && (
                        <div className="more-images">
                          +{donation.images.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {donation.status === "Pending Pickup" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() => updateStatus(donation.id, "Cancelled")}
                    >
                      Cancel
                    </button>
                    <button
                      className="action-btn primary"
                      onClick={() => updateStatus(donation.id, "In Transit")}
                    >
                      Mark as Picked Up
                    </button>
                  </>
                )}

                {donation.status === "In Transit" && (
                  <button
                    className="action-btn primary"
                    onClick={() => updateStatus(donation.id, "Completed")}
                  >
                    Mark as Completed
                  </button>
                )}

                {donation.status === "Completed" && (
                  <div className="completion-info">
                    <span className="completed-text">
                      ✅ Successfully donated!
                    </span>
                  </div>
                )}

                <button className="action-btn outline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveDonations;
