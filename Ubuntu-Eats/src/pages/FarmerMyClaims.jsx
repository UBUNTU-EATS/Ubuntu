import React, { useState } from "react";
import { FaMapMarkerAlt, FaCalendar, FaClock, FaLeaf, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const FarmerMyClaims = ({ claims, onConfirmPickup, onCancelClaim }) => {
  const [processing, setProcessing] = useState(null);

  const handleConfirmPickup = async (claimId, listingId) => {
    if (!window.confirm("Are you sure you have collected this food donation?")) {
      return;
    }

    setProcessing(claimId);
    try {
      await onConfirmPickup(claimId, listingId);
    } catch (error) {
      console.error("Error confirming pickup:", error);
      alert("Failed to confirm pickup. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelClaim = async (claimId, listingId) => {
    if (!window.confirm("Are you sure you want to cancel this claim? This will make the donation available to others.")) {
      return;
    }

    setProcessing(claimId);
    try {
      // Use direct Firestore operations like NGOs do
      await onCancelClaim(claimId, listingId);
      alert("✅ Claim cancelled successfully. The donation is now available to others.");
    } catch (error) {
      console.error("Error canceling claim:", error);
      alert(`❌ Failed to cancel claim: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'claimed':
      case 'pending':
        return <span className="status-badge pending">🔄 Pending Pickup</span>;
      case 'collected':
        return <span className="status-badge collected">✅ Collected</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">❌ Cancelled</span>;
      default:
        return <span className="status-badge unknown">❓ Unknown</span>;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not specified";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getTimeUntilPickup = (collectBy) => {
    if (!collectBy) return "No deadline";
    
    const now = new Date();
    const deadline = collectBy.toDate ? collectBy.toDate() : new Date(collectBy);
    const diffTime = deadline - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffTime < 0) return "⚠️ Overdue";
    if (diffHours < 1) return "🚨 Less than 1 hour left";
    if (diffHours < 24) return `⏰ ${diffHours} hours left`;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `📅 ${diffDays} days left`;
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📦";
    const cat = category.toLowerCase();
    if (cat.includes("vegetables") || cat.includes("produce")) return "🥕";
    if (cat.includes("fruits")) return "🍎";
    if (cat.includes("dairy")) return "🥛";
    if (cat.includes("bakery") || cat.includes("bread")) return "🍞";
    if (cat.includes("meat")) return "🥩";
    if (cat.includes("expired")) return "♻️";
    return "📦";
  };

  // Group claims by status
  const groupedClaims = claims.reduce((groups, claim) => {
    const status = claim.status || 'pending';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(claim);
    return groups;
  }, {});

  const statusOrder = ['CLAIMED', 'PENDING', 'COLLECTED', 'CANCELLED'];

  return (
    <div className="my-claims-container">
      <div className="claims-header">
        <h2>My Food Claims</h2>
        <p>Track your claimed food donations and pickup schedule</p>
      </div>

      {claims.length === 0 ? (
        <div className="empty-state">
          <FaLeaf size={48} color="#2e7d32" />
          <h3>No claims yet</h3>
          <p>Visit the "Claim Food" tab to find food waste suitable for your farm operations</p>
        </div>
      ) : (
        <>
          <div className="claims-summary">
            <div className="summary-card">
              <span className="summary-number">
                {claims.filter(c => c.status === 'CLAIMED' || c.status === 'PENDING').length}
              </span>
              <span className="summary-label">Pending Pickup</span>
            </div>
            <div className="summary-card">
              <span className="summary-number">
                {claims.filter(c => c.status === 'COLLECTED').length}
              </span>
              <span className="summary-label">Successfully Collected</span>
            </div>
            <div className="summary-card">
              <span className="summary-number">
                {claims.length}
              </span>
              <span className="summary-label">Total Claims</span>
            </div>
          </div>

          <div className="claims-sections">
            {statusOrder.map(status => {
              const statusClaims = groupedClaims[status] || [];
              if (statusClaims.length === 0) return null;

              return (
                <div key={status} className="claims-section">
                  <h3 className="section-title">
                    {status === 'CLAIMED' || status === 'PENDING' ? '🔄 Pending Pickup' :
                     status === 'COLLECTED' ? '✅ Collected' :
                     status === 'CANCELLED' ? '❌ Cancelled' : status}
                    <span className="count">({statusClaims.length})</span>
                  </h3>

                  <div className="claims-grid">
                    {statusClaims.map((claim) => {
                      const listingDetails = claim.listingDetails || {};
                      
                      return (
                        <div key={claim.id} className={`claim-card ${status.toLowerCase()}`}>
                          <div className="claim-header">
                            <div className="donor-info">
                              <h4>{listingDetails.listingCompany || claim.donorName || "Unknown Donor"}</h4>
                              {getStatusBadge(claim.status)}
                            </div>
                            <span className="category-icon">
                              {getCategoryIcon(listingDetails.category)}
                            </span>
                          </div>

                          <div className="claim-details">
                            <h5>{listingDetails.foodType || listingDetails.listingName || "Food Item"}</h5>
                            <p className="quantity">{listingDetails.quantity || "Quantity not specified"}</p>
                            
                            {listingDetails.listingDescription && (
                              <p className="description">{listingDetails.listingDescription}</p>
                            )}
                          </div>

                          <div className="claim-meta">
                            <div className="meta-item">
                              <FaCalendar />
                              <span>Claimed: {formatDate(claim.claimedAt)}</span>
                            </div>
                            
                            {listingDetails.address && (
                              <div className="meta-item">
                                <FaMapMarkerAlt />
                                <span>{listingDetails.address}</span>
                              </div>
                            )}

                            {listingDetails.collectBy && (
                              <div className="meta-item urgency">
                                <FaClock />
                                <span>{getTimeUntilPickup(listingDetails.collectBy)}</span>
                              </div>
                            )}

                            {claim.collectedAt && (
                              <div className="meta-item">
                                <FaCheckCircle />
                                <span>Collected: {formatDate(claim.collectedAt)}</span>
                              </div>
                            )}
                          </div>

                          <div className="claim-actions">
                            {(claim.status === 'CLAIMED' || claim.status === 'PENDING') && (
                              <>
                                <button
                                  className="confirm-btn"
                                  onClick={() => handleConfirmPickup(claim.id, claim.listingId)}
                                  disabled={processing === claim.id}
                                >
                                  {processing === claim.id ? (
                                    <>⏳ Processing...</>
                                  ) : (
                                    <>✅ Confirm Pickup</>
                                  )}
                                </button>
                                <button
                                  className="cancel-btn"
                                  onClick={() => handleCancelClaim(claim.id, claim.listingId)}
                                  disabled={processing === claim.id}
                                >
                                  ❌ Cancel Claim
                                </button>
                              </>
                            )}

                            {claim.status === 'COLLECTED' && (
                              <div className="success-message">
                                <FaCheckCircle /> Successfully collected for farm use
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="claims-tips">
        <h3>📋 Pickup Guidelines</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>🕐 Be Punctual</h4>
            <p>Arrive within the specified pickup time to ensure food quality and availability.</p>
          </div>
          <div className="tip-card">
            <h4>🧊 Bring Containers</h4>
            <p>Bring appropriate containers or bags for transporting claimed food items.</p>
          </div>
          <div className="tip-card">
            <h4>📋 Check Quality</h4>
            <p>Inspect food quality upon pickup and confirm it meets your farm's requirements.</p>
          </div>
          <div className="tip-card">
            <h4>📞 Stay Connected</h4>
            <p>Keep your contact information updated and respond to donor communications promptly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerMyClaims;