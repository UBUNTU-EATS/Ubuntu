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
  const [selectedDonation, setSelectedDonation] = useState(null);

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

  const getStatusConfig = (status) => {
    const configs = {
      CLAIMED: {
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: "🔔",
        label: "To Collect",
      },
      COLLECTED: {
        color: "#059669",
        bg: "#a7f3d0",
        icon: "✅",
        label: "Collected",
      },
      CANCELLED: {
        color: "#ef4444",
        bg: "#fecaca",
        icon: "❌",
        label: "Cancelled",
      },
    };
    return configs[status] || configs["CLAIMED"];
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

  const getCategoryLabel = (category) => {
    if (!category) return "Unknown";
    return category.replace(/-/g, " ");
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

  // Calculate statistics for header
  const totalClaims = donations.length;
  const toCollectClaims = donations.filter(
    (d) => d.status === "CLAIMED"
  ).length;
  const collectedClaims = donations.filter(
    (d) => d.status === "COLLECTED"
  ).length;

  return (
    <div className="modern-claimed-donations">
      {/* Controls Section */}
      <div className="donations-controls">
        <div className="filter-section">
          <div className="filter-pills">
            {[
              { key: "all", label: "All Claims", count: totalClaims },
              { key: "CLAIMED", label: "To Collect", count: toCollectClaims },
              { key: "COLLECTED", label: "Collected", count: collectedClaims },
            ].map((filter) => (
              <button
                key={filter.key}
                className={`filter-pill ${
                  activeFilter === filter.key ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
                <span className="pill-count">{filter.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <div className="empty-container">
          <div className="empty-illustration">📦</div>
          <h3>No claimed donations</h3>
          <p>
            You haven't claimed any donations yet. Browse available donations to
            get started.
          </p>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map((donation) => {
            const statusConfig = getStatusConfig(donation.status);

            return (
              <div key={donation.claimId} className="donation-item">
                {/* Image Section */}
                {donation.imageURL && (
                  <div className="item-image">
                    <img
                      src={donation.imageURL}
                      alt={donation.foodType || "Food donation"}
                    />
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
                      <h3>
                        {donation.listingCompany ||
                          donation.donorName ||
                          "Unknown Donor"}
                      </h3>
                      <span className="claim-date">
                        Claimed on {formatDate(donation.claimDate)}
                      </span>
                    </div>

                    <div className="item-status">
                      <span
                        className="status-dot"
                        style={{ backgroundColor: statusConfig.color }}
                      ></span>
                      <span
                        className="status-text"
                        style={{ color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="content-details">
                    <div className="food-details">
                      <h4>{donation.foodType || "Food Donation"}</h4>
                      <span className="item-quantity">
                        {donation.quantity} {donation.unit || "units"}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">
                        {getCategoryIcon(
                          donation.typeOfFood || donation.category
                        )}
                      </span>
                      <span className="detail-text">
                        {getCategoryLabel(
                          donation.typeOfFood || donation.category
                        )}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        Pickup by{" "}
                        {formatDate(donation.collectBy || donation.pickupTime)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">
                        {donation.address ||
                          donation.location ||
                          "Location not specified"}
                      </span>
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

                  {/* Volunteer Timeout Notification */}
                  {volunteerTimeoutDonations.includes(donation.claimId) && (
                    <div className="volunteer-timeout-notification">
                      <div className="timeout-alert">
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                          <h4>No Volunteer Available</h4>
                          <p>
                            No volunteer has been assigned yet. Would you like
                            to collect yourself or cancel this claim?
                          </p>
                          <div className="timeout-actions">
                            <button
                              className="action-button primary"
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
                              className="action-button secondary"
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
                          className={`action-button ${
                            donation.collectionMethod === "self"
                              ? "primary"
                              : "outline"
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
                          className={`action-button ${
                            donation.collectionMethod === "volunteer"
                              ? "primary"
                              : "outline"
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
                          Please collect the donation at the scheduled time.
                          Don't forget to confirm collection when you receive
                          it.
                        </p>
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

                  {donation.status === "CLAIMED" && (
                    <>
                      <button
                        className="action-button secondary"
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
                          className="action-button primary"
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
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedDonation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedDonation(null)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedDonation.listingCompany ||
                  selectedDonation.donorName ||
                  "Unknown Donor"}
              </h2>
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
                    alt={selectedDonation.foodType || "Food donation"}
                  />
                </div>
              )}

              <div className="modal-details">
                <div className="detail-section">
                  <h4>Food Details</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Food Type:</strong>
                      <span>
                        {selectedDonation.foodType || "Food Donation"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Quantity:</strong>
                      <span>
                        {selectedDonation.quantity}{" "}
                        {selectedDonation.unit || "units"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>
                        {getCategoryIcon(
                          selectedDonation.typeOfFood ||
                            selectedDonation.category
                        )}
                        {getCategoryLabel(
                          selectedDonation.typeOfFood ||
                            selectedDonation.category
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Pickup Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item full-width">
                      <strong>Location:</strong>
                      <span>
                        {selectedDonation.address ||
                          selectedDonation.location ||
                          "Location not specified"}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Pickup By:</strong>
                      <span>
                        {formatDate(
                          selectedDonation.collectBy ||
                            selectedDonation.pickupTime
                        )}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact Person:</strong>
                      <span>{selectedDonation.contactPerson || "N/A"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact Phone:</strong>
                      <span>{selectedDonation.contactPhone || "N/A"}</span>
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

                <div className="detail-section">
                  <h4>Claim Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Status:</strong>
                      <span
                        style={{
                          color: getStatusConfig(selectedDonation.status).color,
                        }}
                      >
                        {getStatusConfig(selectedDonation.status).label}
                      </span>
                    </div>
                    <div className="grid-item">
                      <strong>Claimed On:</strong>
                      <span>{formatDate(selectedDonation.claimDate)}</span>
                    </div>
                    {selectedDonation.collectionMethod && (
                      <div className="grid-item">
                        <strong>Collection Method:</strong>
                        <span>
                          {selectedDonation.collectionMethod === "self"
                            ? "Self Collection"
                            : "Volunteer Assistance"}
                        </span>
                      </div>
                    )}
                    {selectedDonation.collectedAt && (
                      <div className="grid-item">
                        <strong>Collected On:</strong>
                        <span>{formatDate(selectedDonation.collectedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-button secondary"
                onClick={() => setSelectedDonation(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimedDonations;
