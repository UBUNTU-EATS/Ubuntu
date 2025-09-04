import React, { useState } from "react";
import { FaMapMarkerAlt, FaCalendar, FaClock, FaUser, FaLeaf, FaRoute } from "react-icons/fa";
import RouteMap from "./RouteMap";

const AvailableFoodClaims = ({ donations, onClaim }) => {
  const [filter, setFilter] = useState('all');
  const [claiming, setClaiming] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Get user location for route mapping
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to Johannesburg center if location access denied
          setUserLocation({ lat: -26.2041, lng: 28.0473 });
        }
      );
    } else {
      setUserLocation({ lat: -26.2041, lng: 28.0473 });
    }
  }, []);

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    return donation.category?.toLowerCase().includes(filter.toLowerCase());
  });

  const handleClaim = async (donationId) => {
    setClaiming(donationId);
    try {
      await onClaim(donationId);
    } catch (error) {
      console.error("Error claiming donation:", error);
    } finally {
      setClaiming(null);
    }
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

  const getTimeUntilExpiry = (expiryDate) => {
    if (!expiryDate) return "No expiry date";
    
    const now = new Date();
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "⚠️ Expired";
    if (diffDays === 0) return "⚡ Expires today";
    if (diffDays === 1) return "⏰ Expires tomorrow";
    return `📅 ${diffDays} days left`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not specified";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="available-donations-container">
      <div className="donations-header">
        <h2>Available Food for Claim</h2>
        <p>Find food waste and surplus suitable for composting, animal feed, or farm use</p>
      </div>

      <div className="donations-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select 
            id="category-filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="dairy">Dairy</option>
            <option value="bakery">Bakery</option>
            <option value="meat">Meat</option>
            <option value="expired">Expired Items</option>
          </select>
        </div>
        <div className="results-count">
          Showing {filteredDonations.length} available items
        </div>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <FaLeaf size={48} color="#2e7d32" />
          <h3>No food available for claim</h3>
          <p>Check back later for new food donations suitable for farm use</p>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map((donation) => (
            <div key={donation.id} className="donation-card">
              <div className="card-header">
                <div className="donor-info">
                  <h3>{donation.listingCompany || donation.donorName || "Unknown Donor"}</h3>
                  <p className="distance">
                    📍 {donation.address || donation.location || "Location not specified"}
                  </p>
                </div>
                <span className="category-badge">
                  {getCategoryIcon(donation.category)} {donation.category || "General"}
                </span>
              </div>

              <div className="food-details">
                <h4>{donation.foodType || donation.listingName || "Food Item"}</h4>
                <p className="quantity">{donation.quantity || "Quantity not specified"}</p>
                {donation.listingDescription && (
                  <p className="description">{donation.listingDescription}</p>
                )}
              </div>

              <div className="donation-meta">
                {donation.collectBy && (
                  <div className="meta-item">
                    <span className="meta-label">
                      <FaCalendar /> Collect By:
                    </span>
                    <span className="meta-value">{formatDate(donation.collectBy)}</span>
                  </div>
                )}

                {donation.expiryDate && (
                  <div className="meta-item">
                    <span className="meta-label">
                      <FaClock /> Expiry Status:
                    </span>
                    <span className="meta-value">{getTimeUntilExpiry(donation.expiryDate)}</span>
                  </div>
                )}

                {donation.address && (
                  <div className="meta-item">
                    <span className="meta-label">
                      <FaMapMarkerAlt /> Pickup Location:
                    </span>
                    <span className="meta-value">{donation.address}</span>
                  </div>
                )}

                {donation.contactPerson && (
                  <div className="meta-item">
                    <span className="meta-label">
                      <FaUser /> Contact:
                    </span>
                    <span className="meta-value">{donation.contactPerson}</span>
                  </div>
                )}

                {donation.specialInstructions && (
                  <div className="meta-item">
                    <span className="meta-label">
                      📋 Instructions:
                    </span>
                    <span className="meta-value">{donation.specialInstructions}</span>
                  </div>
                )}

                {donation.forFarmers && (
                  <div className="meta-item special-highlight">
                    <span className="meta-label">
                      🚜 Farm Suitable:
                    </span>
                    <span className="meta-value">Specially marked for farmers</span>
                  </div>
                )}

                <div className="meta-item">
                  <span className="meta-label">
                    📅 Listed:
                  </span>
                  <span className="meta-value">{formatDate(donation.dateListed)}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="view-details-btn" 
                  onClick={() => setSelectedDonation(donation)}
                >
                  <FaRoute /> View Details & Route
                </button>
                <button 
                  className="claim-btn" 
                  onClick={() => handleClaim(donation.id)}
                  disabled={claiming === donation.id}
                >
                  {claiming === donation.id ? (
                    <>⏳ Claiming...</>
                  ) : (
                    <>🚜 Claim for Farm</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="farmer-tips">
        <h3>💡 Tips for Farmers</h3>
        <ul>
          <li><strong>Composting:</strong> Expired vegetables and fruits make excellent compost material</li>
          <li><strong>Animal Feed:</strong> Some dairy and bakery items can be suitable for livestock (check with vet)</li>
          <li><strong>Quick Pickup:</strong> Claim items close to expiry for immediate use or processing</li>
          <li><strong>Food Safety:</strong> Always inspect food quality before use, especially for animal feed</li>
        </ul>
      </div>

      {/* Details Modal with Map */}
      {selectedDonation && (
        <div className="modal-backdrop" onClick={() => setSelectedDonation(null)}>
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDonation.listingCompany || selectedDonation.donorName || "Food Donation"}</h2>
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
                      <span>{selectedDonation.foodType || selectedDonation.listingName || "Not specified"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Quantity:</strong>
                      <span>{selectedDonation.quantity || "Not specified"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Category:</strong>
                      <span>{selectedDonation.category || "General"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Condition:</strong>
                      <span>{getTimeUntilExpiry(selectedDonation.expiryDate)}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Farm Suitable:</strong>
                      <span>{selectedDonation.forFarmers ? "✅ Yes" : "🌱 Good for composting"}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Listed:</strong>
                      <span>{formatDate(selectedDonation.dateListed)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Collection Information</h4>
                  <div className="detail-grid">
                    <div className="grid-item">
                      <strong>Collect By:</strong>
                      <span>{formatDate(selectedDonation.collectBy)}</span>
                    </div>
                    <div className="grid-item">
                      <strong>Contact Person:</strong>
                      <span>{selectedDonation.contactPerson || "See pickup location"}</span>
                    </div>
                    <div className="grid-item full-width">
                      <strong>Pickup Address:</strong>
                      <span>{selectedDonation.address || "Location not specified"}</span>
                    </div>
                  </div>
                </div>

                {selectedDonation.listingDescription && (
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{selectedDonation.listingDescription}</p>
                  </div>
                )}

                {selectedDonation.specialInstructions && (
                  <div className="detail-section">
                    <h4>Special Instructions</h4>
                    <p>{selectedDonation.specialInstructions}</p>
                  </div>
                )}

                {/* Map Section */}
                <div className="detail-section">
                  <h4>Route to Collection Point</h4>
                  <div className="map-section" style={{ marginTop: "15px" }}>
                    {userLocation && (
                      <RouteMap
                        origin={userLocation}
                        destination={selectedDonation.coordinates || { lat: -26.2041, lng: 28.0473 }}
                        originLabel="Your Farm"
                        destinationLabel={selectedDonation.listingCompany || "Pickup Location"}
                        originIcon="🚜"
                        destinationIcon="🏪"
                        mapContainerStyle={{ width: "100%", height: "350px" }}
                        zoom={12}
                        showRouteInfo={true}
                        autoShowRoute={true}
                        className="farmer-route-map"
                      />
                    )}
                  </div>
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#f0fff4', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    border: '1px solid #2e7d32'
                  }}>
                    <p><strong>🚜 For Farmers:</strong> Plan your route and ensure you have appropriate containers for transport</p>
                    <p><strong>📞 Contact:</strong> Call ahead to confirm availability and pickup procedures</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="claim-modal-btn"
                  onClick={() => {
                    handleClaim(selectedDonation.id);
                    setSelectedDonation(null);
                  }}
                  disabled={claiming === selectedDonation.id}
                >
                  {claiming === selectedDonation.id ? (
                    <>⏳ Claiming...</>
                  ) : (
                    <>🚜 Claim for Farm</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableFoodClaims;