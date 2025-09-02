import React, { useState, useEffect } from "react";
import "../styles/ClaimedDonations.css";

const ClaimedDonations = ({
  donations,
  onSetCollectionMethod,
  onConfirmCollection,
  onCancelClaim,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [processing, setProcessing] = useState(null);
  const [volunteerTimeoutDonations, setVolunteerTimeoutDonations] = useState(
    []
  );

  // Timer effect to check for volunteer timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedTimeouts = [];

      donations.forEach((donation) => {
        if (
          donation.status === "CLAIMED" &&
          donation.collectionMethod === "volunteer" &&
          (!donation.volunteerAssigned ||
            donation.volunteerAssigned === null) &&
          donation.claimDate
        ) {
          const claimDate = donation.claimDate.toDate
            ? donation.claimDate.toDate()
            : new Date(donation.claimDate);

          const pickupTime = donation.pickupTime
            ? new Date(donation.pickupTime)
            : new Date(claimDate.getTime() + 24 * 60 * 60 * 1000);

          const timeDifference = pickupTime - claimDate;
          const halfTime = claimDate.getTime() + timeDifference / 2;

          if (
            now.getTime() >= halfTime &&
            !volunteerTimeoutDonations.includes(donation.claimId)
          ) {
            updatedTimeouts.push(donation.claimId);
          }
        }
      });

      if (updatedTimeouts.length > 0) {
        setVolunteerTimeoutDonations((prev) => [...prev, ...updatedTimeouts]);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [donations, volunteerTimeoutDonations]);

  const filteredDonations = donations.filter((donation) => {
    if (activeFilter === "all") return true;
    return donation.status === activeFilter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CLAIMED":
        return "status-claimed";
      case "COLLECTED":
        return "status-collected";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-claimed";
    }
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📦";
    switch (category.toLowerCase()) {
      case "fresh meals":
      case "fresh-meals":
        return "🍽️";
      case "baked goods":
      case "bakery":
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

  const handleSetCollectionMethod = async (claimId, method) => {
    setProcessing(claimId);
    try {
      await onSetCollectionMethod(claimId, method);
      if (method === "self") {
        setVolunteerTimeoutDonations((prev) =>
          prev.filter((id) => id !== claimId)
        );
      }
    } catch (error) {
      console.error("Error setting collection method:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmCollection = async (claimId, listingId) => {
    setProcessing(claimId);
    try {
      await onConfirmCollection(claimId, listingId);
    } catch (error) {
      console.error("Error confirming collection:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelClaim = async (claimId, listingId) => {
    setProcessing(claimId);
    try {
      await onCancelClaim(claimId, listingId);
      setVolunteerTimeoutDonations((prev) =>
        prev.filter((id) => id !== claimId)
      );
    } catch (error) {
      console.error("Error canceling claim:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleVolunteerTimeoutAction = async (claimId, listingId, action) => {
    setProcessing(claimId);
    try {
      if (action === "self") {
        await onSetCollectionMethod(claimId, "self");
      } else if (action === "cancel") {
        await onCancelClaim(claimId, listingId);
      }
      setVolunteerTimeoutDonations((prev) =>
        prev.filter((id) => id !== claimId)
      );
    } catch (error) {
      console.error("Error handling volunteer timeout:", error);
    } finally {
      setProcessing(null);
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
          className={`filter-tab ${activeFilter === "CLAIMED" ? "active" : ""}`}
          onClick={() => setActiveFilter("CLAIMED")}
        >
          To Collect ({donations.filter((d) => d.status === "CLAIMED").length})
        </button>
        <button
          className={`filter-tab ${
            activeFilter === "COLLECTED" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("COLLECTED")}
        >
          Collected ({donations.filter((d) => d.status === "COLLECTED").length})
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
            <div key={donation.claimId} className="claimed-card">
              <div className="card-header">
                <div className="donor-info">
                  <h3>
                    {donation.listingCompany ||
                      donation.donorName ||
                      "Unknown Donor"}
                  </h3>
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
                    {donation.status
                      ? donation.status.charAt(0).toUpperCase() +
                        donation.status.slice(1).toLowerCase()
                      : "Unknown"}
                  </span>
                  <div className="category-badge">
                    {getCategoryIcon(donation.typeOfFood || donation.category)}
                    {donation.typeOfFood || donation.category || "Unknown"}
                  </div>
                </div>
              </div>

              <div className="card-content">
                <div className="food-details">
                  <h4>{donation.foodType || "Food Donation"}</h4>
                  <p className="quantity">
                    {donation.quantity} {donation.unit || "units"}
                  </p>
                </div>

                {donation.imageURL && (
                  <div className="claimed-image">
                    <img
                      src={donation.imageURL}
                      alt={donation.foodType || "Food donation"}
                    />
                  </div>
                )}

                <div className="donation-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 Pickup By:</span>
                    <span className="meta-value">
                      {formatDate(donation.collectBy || donation.pickupTime)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Location:</span>
                    <span className="meta-value">
                      {donation.address ||
                        donation.location ||
                        "Location not specified"}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📞 Contact:</span>
                    <span className="meta-value">
                      {donation.contactPerson || "N/A"} -{" "}
                      {donation.contactPhone || "N/A"}
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

                {/* Volunteer Timeout Notification */}
                {volunteerTimeoutDonations.includes(donation.claimId) && (
                  <div className="volunteer-timeout-notification">
                    <div className="timeout-alert">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-content">
                        <h4>No Volunteer Available</h4>
                        <p>
                          No volunteer has been assigned yet. Would you like to
                          collect yourself or cancel this claim?
                        </p>
                        <div className="timeout-actions">
                          <button
                            className="action-btn primary"
                            onClick={() =>
                              handleVolunteerTimeoutAction(
                                donation.claimId,
                                donation.id || donation.listingId,
                                "self"
                              )
                            }
                            disabled={processing === donation.claimId}
                          >
                            {processing === donation.claimId
                              ? "Processing..."
                              : "Collect Myself"}
                          </button>
                          <button
                            className="action-btn secondary"
                            onClick={() =>
                              handleVolunteerTimeoutAction(
                                donation.claimId,
                                donation.id || donation.listingId,
                                "cancel"
                              )
                            }
                            disabled={processing === donation.claimId}
                          >
                            {processing === donation.claimId
                              ? "Canceling..."
                              : "Cancel Claim"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {donation.status === "CLAIMED" && (
                  <div className="collection-method">
                    <h4>Collection Method</h4>
                    <div className="method-options">
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "self" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleSetCollectionMethod(donation.claimId, "self")
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Processing..."
                          : "🚗 Self Collection"}
                      </button>
                      <button
                        className={`method-btn ${
                          donation.collectionMethod === "volunteer"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSetCollectionMethod(
                            donation.claimId,
                            "volunteer"
                          )
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Processing..."
                          : "🤝 Volunteer Assistance"}
                      </button>
                    </div>
                  </div>
                )}

                {donation.collectionMethod === "volunteer" &&
                  donation.status === "CLAIMED" && (
                    <div className="volunteer-info">
                      <div className="volunteer-assigned">
                        <span className="waiting-text">
                          ⏳ Waiting for volunteer assignment...
                        </span>
                      </div>
                    </div>
                  )}

                {donation.collectionMethod === "self" &&
                  donation.status === "CLAIMED" && (
                    <div className="collection-instructions">
                      <p>
                        Please collect the donation at the scheduled time. Don't
                        forget to confirm collection when you receive it.
                      </p>
                    </div>
                  )}
              </div>

              <div className="card-actions">
                {donation.status === "CLAIMED" && (
                  <>
                    <button
                      className="action-btn secondary"
                      onClick={() =>
                        handleCancelClaim(
                          donation.claimId,
                          donation.id || donation.listingId
                        )
                      }
                      disabled={processing === donation.claimId}
                    >
                      {processing === donation.claimId
                        ? "Canceling..."
                        : "Cancel Claim"}
                    </button>
                    {donation.collectionMethod === "self" && (
                      <button
                        className="action-btn primary"
                        onClick={() =>
                          handleConfirmCollection(
                            donation.claimId,
                            donation.id || donation.listingId
                          )
                        }
                        disabled={processing === donation.claimId}
                      >
                        {processing === donation.claimId
                          ? "Confirming..."
                          : "Confirm Collection"}
                      </button>
                    )}
                  </>
                )}

                {donation.status === "COLLECTED" && (
                  <div className="completion-info">
                    <span className="completed-text">
                      ✅ Successfully collected!
                    </span>
                    <span className="completion-date">
                      Collected on {formatDate(donation.collectedAt)}
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
