// Updated FarmersDashboard.jsx with Donation Form Integration
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import FarmerProfile from "./FarmerProfile";
import AvailableFoodClaims from "./AvailableFoodClaims";
import FarmerDonationForm from "./FarmerDonationForm";
import FarmerMyClaims from "./FarmerMyClaims";
import LoadingDots from "./loading";
import "../styles/FarmerDashboard.css";

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [farmerData, setFarmerData] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [claimedDonations, setClaimedDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  // Wait for Firebase Auth to initialize before fetching farmer data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      if (user) {
        setUserEmail(user.email);
        fetchFarmerDataAndDonations(user);
      } else {
        navigate("/"); // Redirect if not authenticated
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, [navigate]);

  // Fetch farmer data and donations - enhanced with farmer's own donations
  const fetchFarmerDataAndDonations = async (user) => {
    try {
      setLoading(true);

      // Check if user is a farmer
      const userDocRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error("Farmer data not found for email:", user.email);
        navigate("/");
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== "farmer") {
        console.warn("User is not a farmer!");
        navigate("/");
        return;
      }

      setFarmerData(userData);

      // Fetch available donations (UNCLAIMED status) - same as NGO
      const availableQuery = query(
        collection(db, "foodListings"),
        where("listingStatus", "==", "UNCLAIMED")
      );

      const availableUnsubscribe = onSnapshot(availableQuery, (snapshot) => {
        const donations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableDonations(donations);
      });

      // Fetch claimed donations by this farmer
      const claimedQuery = query(
        collection(db, "claims"),
        where("farmerEmail", "==", user.email)
      );

      const claimedUnsubscribe = onSnapshot(claimedQuery, async (snapshot) => {
        const claims = snapshot.docs.map((doc) => ({
          claimId: doc.id,
          ...doc.data(),
        }));

        // Get the actual donation data for each claim
        const claimedDonationsData = await Promise.all(
          claims.map(async (claim) => {
            try {
              const donationDoc = await getDoc(
                doc(db, "foodListings", claim.listingId)
              );
              if (donationDoc.exists()) {
                return {
                  ...claim,
                  ...donationDoc.data(),
                  claimId: claim.claimId,
                };
              }
              return claim;
            } catch (error) {
              console.error("Error fetching donation data:", error);
              return claim;
            }
          })
        );

        setClaimedDonations(claimedDonationsData);
      });

      // NEW: Fetch farmer's own donations
      const myDonationsQuery = query(
        collection(db, "foodListings"),
        where("donorEmail", "==", user.email)
      );

      const myDonationsUnsubscribe = onSnapshot(myDonationsQuery, (snapshot) => {
        const donations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMyDonations(donations);
      });

      setLoading(false);

      // Store unsubscribe functions for cleanup
      return () => {
        availableUnsubscribe();
        claimedUnsubscribe();
        myDonationsUnsubscribe();
      };
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      navigate("/");
      setLoading(false);
    }
  };

  // Handle successful donation form submission
  const handleDonationSubmit = async (donationData) => {
    console.log("Farmer donation submitted:", donationData);
    // The form handles backend submission
    // Switch to "My Donations" tab to show the new donation
    setActiveTab("mydonations");
  };

  // Claim donation - following NGO pattern exactly
  const claimDonation = async (donationId, collectionMethod = "self") => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const donationRef = doc(db, "foodListings", donationId);
      const donationDoc = await getDoc(donationRef);

      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }

      const donationData = donationDoc.data();

      // Get farmer name from farmerData or use a fallback
      let farmerName = "Unknown Farmer";
      if (farmerData) {
        farmerName = farmerData.name || farmerData.farmName || "Unknown Farmer";
      }

      // Create claim record - similar to NGO but with farmer fields
      const claimData = {
        listingId: donationId,
        farmerId: user.uid,
        farmerEmail: user.email,
        farmerName: farmerName,
        claimDate: serverTimestamp(),
        status: "PENDING",
        collectionMethod: collectionMethod || "self",
        volunteerAssigned: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "claims"), claimData);

      // Update donation status
      await updateDoc(donationRef, {
        listingStatus: "PENDING",
        claimedBy: user.uid,
        claimedByEmail: user.email,
        claimedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error claiming donation:", error);
      throw error;
    }
  };

  // Set collection method
  const setCollectionMethod = async (claimId, method) => {
    try {
      const claimRef = doc(db, "claims", claimId);
      await updateDoc(claimRef, {
        collectionMethod: method,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error setting collection method:", error);
      throw error;
    }
  };

  // Confirm collection
  const confirmCollection = async (claimId, listingId) => {
    try {
      const claimRef = doc(db, "claims", claimId);
      const listingRef = doc(db, "foodListings", listingId);

      await updateDoc(claimRef, {
        status: "COLLECTED",
        collectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(listingRef, {
        listingStatus: "COLLECTED",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error confirming collection:", error);
      throw error;
    }
  };

  // Cancel claim
  const cancelClaim = async (claimId, listingId) => {
    try {
      const claimRef = doc(db, "claims", claimId);
      const listingRef = doc(db, "foodListings", listingId);

      // Update claim status
      await updateDoc(claimRef, {
        status: "CANCELLED",
        updatedAt: serverTimestamp(),
      });

      // Reset donation status
      await updateDoc(listingRef, {
        listingStatus: "UNCLAIMED",
        claimedBy: null,
        claimedByEmail: null,
        claimedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error canceling claim:", error);
      throw error;
    }
  };

  // Show loading while waiting for auth state
  if (authLoading) {
    return (
      <section className="loading">
        <LoadingDots numDots={10} radius={60} speed={0.6} size={20} />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="loading">
        <LoadingDots numDots={10} radius={60} speed={0.6} size={20} />
      </section>
    );
  }

  return (
    <div className="farmer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Farmer Dashboard</h1>
          <p className="welcome-text">
            Welcome, {farmerData?.name || farmerData?.farmName || userEmail}!
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{availableDonations.length}</span>
            <span className="stat-label">Available Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{claimedDonations.length}</span>
            <span className="stat-label">My Claims</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{myDonations.length}</span>
            <span className="stat-label">My Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {claimedDonations.filter((d) => d.status === "COLLECTED").length}
            </span>
            <span className="stat-label">Successful Collections</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </button>
        <button
          className={`nav-tab ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Available Food ({availableDonations.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "claimed" ? "active" : ""}`}
          onClick={() => setActiveTab("claimed")}
        >
          My Claims ({claimedDonations.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "donate" ? "active" : ""}`}
          onClick={() => setActiveTab("donate")}
        >
          🌱 Donate Surplus
        </button>
        <button
          className={`nav-tab ${activeTab === "mydonations" ? "active" : ""}`}
          onClick={() => setActiveTab("mydonations")}
        >
          My Donations ({myDonations.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "profile" && farmerData && (
          <FarmerProfile farmerData={farmerData} setFarmerData={setFarmerData} />
        )}


         {activeTab === "available" && (
          <AvailableFoodClaims
            donations={availableDonations}
            onClaim={claimDonation}
          />
        )}

        {activeTab === "claimed" && (
          <FarmerMyClaims
            claims={claimedDonations}
            onSetCollectionMethod={setCollectionMethod}
            onConfirmCollection={confirmCollection}
            onCancelClaim={cancelClaim}
          />
        )}

        {activeTab === "donate" && (
          <FarmerDonationForm
            onSubmit={handleDonationSubmit}
            farmerData={farmerData}
          />
        )}

        {activeTab === "mydonations" && (
          <FarmerMyDonations donations={myDonations} />
        )}
      </main>
    </div>
  );
};

// Component to display farmer's own donations
const FarmerMyDonations = ({ donations }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'UNCLAIMED': return '#f59e0b';
      case 'PENDING': return '#3b82f6';
      case 'CLAIMED': return '#10b981';
      case 'COLLECTED': return '#059669';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UNCLAIMED': return '🟡';
      case 'PENDING': return '🔵';
      case 'CLAIMED': return '✅';
      case 'COLLECTED': return '🎉';
      case 'CANCELLED': return '❌';
      default: return '📦';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (donations.length === 0) {
    return (
      <div className="my-donations-container">
        <div className="donations-header">
          <h2>My Farm Donations</h2>
          <p>Track the donations you've shared with the community</p>
        </div>

        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No Donations Yet</h3>
          <p>You haven't made any donations yet.</p>
          <p>Use the "Donate Surplus" tab to share your excess produce!</p>
        </div>
      </div>
    );
  }

  // Group donations by status
  const groupedDonations = donations.reduce((groups, donation) => {
    const status = donation.listingStatus || 'UNCLAIMED';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(donation);
    return groups;
  }, {});

  const statusOrder = ['UNCLAIMED', 'PENDING', 'CLAIMED', 'COLLECTED', 'CANCELLED'];

  return (
    <div className="my-donations-container">
      <div className="donations-header">
        <h2>My Farm Donations</h2>
        <p>Track the donations you've shared with the community</p>
      </div>

      <div className="donations-summary">
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => d.listingStatus === 'UNCLAIMED').length}
          </span>
          <span className="summary-label">Available</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => ['PENDING', 'CLAIMED'].includes(d.listingStatus)).length}
          </span>
          <span className="summary-label">Claimed</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.filter(d => d.listingStatus === 'COLLECTED').length}
          </span>
          <span className="summary-label">Successfully Collected</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {donations.reduce((total, d) => total + (parseInt(d.quantity) || 0), 0)}
          </span>
          <span className="summary-label">Total Quantity Shared</span>
        </div>
      </div>

      <div className="donations-sections">
        {statusOrder.map((status) => {
          const statusDonations = groupedDonations[status];
          if (!statusDonations || statusDonations.length === 0) return null;

          const getStatusTitle = (status) => {
            switch (status) {
              case 'UNCLAIMED': return '🟡 Available for Claiming';
              case 'PENDING': return '🔵 Pending Pickup';
              case 'CLAIMED': return '✅ Claimed - Awaiting Collection';
              case 'COLLECTED': return '🎉 Successfully Collected';
              case 'CANCELLED': return '❌ Cancelled';
              default: return status;
            }
          };

          return (
            <div key={status} className="donations-section">
              <h3 className="section-title">
                {getStatusTitle(status)}
                <span className="count">{statusDonations.length}</span>
              </h3>

              <div className="donations-grid">
                {statusDonations.map((donation) => (
                  <div key={donation.id} className="donation-card">
                    <div className="donation-header">
                      <div className="donation-title">
                        <span className="category-icon">
                          {donation.category === 'vegetables' ? '🥕' :
                           donation.category === 'fruits' ? '🍎' :
                           donation.category === 'dairy' ? '🥛' :
                           donation.category === 'grains' ? '🌾' :
                           donation.category === 'herbs' ? '🌿' : '📦'}
                        </span>
                        <div>
                          <h4>{donation.foodType || 'Farm Produce'}</h4>
                          <p className="donation-category">{donation.category}</p>
                        </div>
                      </div>
                      <div 
                        className="donation-status"
                        style={{ 
                          backgroundColor: getStatusColor(donation.listingStatus),
                          color: 'white'
                        }}
                      >
                        {getStatusIcon(donation.listingStatus)} {donation.listingStatus}
                      </div>
                    </div>

                    <div className="donation-details">
                      <div className="detail-row">
                        <span className="detail-label">📦 Quantity:</span>
                        <span className="detail-value">{donation.quantity} {donation.unit}</span>
                      </div>
                      
                      {donation.condition && (
                        <div className="detail-row">
                          <span className="detail-label">⭐ Condition:</span>
                          <span className="detail-value">{donation.condition}</span>
                        </div>
                      )}

                      {donation.organicCertified && (
                        <div className="detail-row">
                          <span className="detail-label">🌱 Organic:</span>
                          <span className="detail-value">Yes</span>
                        </div>
                      )}

                      <div className="detail-row">
                        <span className="detail-label">📅 Listed:</span>
                        <span className="detail-value">{formatDate(donation.createdAt)}</span>
                      </div>

                      {donation.claimedByEmail && (
                        <div className="detail-row">
                          <span className="detail-label">👤 Claimed by:</span>
                          <span className="detail-value">{donation.claimedByEmail}</span>
                        </div>
                      )}

                      {donation.collectBy && (
                        <div className="detail-row">
                          <span className="detail-label">⏰ Pickup by:</span>
                          <span className="detail-value">{formatDate(donation.collectBy)}</span>
                        </div>
                      )}
                    </div>

                    {donation.listingDescription && (
                      <div className="donation-description">
                        <p>{donation.listingDescription}</p>
                      </div>
                    )}

                    <div className="donation-actions">
                      {donation.listingStatus === 'COLLECTED' && (
                        <div className="success-message">
                          <span>🎉 Thank you for helping reduce food waste!</span>
                        </div>
                      )}
                      
                      {donation.listingStatus === 'UNCLAIMED' && (
                        <div className="waiting-message">
                          <span>⏳ Waiting for someone to claim your donation</span>
                        </div>
                      )}
                      
                      {['PENDING', 'CLAIMED'].includes(donation.listingStatus) && (
                        <div className="claimed-message">
                          <span>✅ Someone has claimed your donation!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact Summary */}
      <div className="impact-summary">
        <h3>🌍 Your Impact</h3>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-number">{donations.length}</div>
            <div className="impact-label">Donations Shared</div>
          </div>
          <div className="impact-card">
            <div className="impact-number">
              {donations.filter(d => d.listingStatus === 'COLLECTED').length}
            </div>
            <div className="impact-label">Successfully Collected</div>
          </div>
          <div className="impact-card">
            <div className="impact-number">
              {Math.round((donations.filter(d => d.listingStatus === 'COLLECTED').length / donations.length) * 100) || 0}%
            </div>
            <div className="impact-label">Success Rate</div>
          </div>
          <div className="impact-card">
            <div className="impact-number">
              {donations.reduce((total, d) => 
                d.listingStatus === 'COLLECTED' ? total + (parseInt(d.quantity) || 0) : total, 0
              )}
            </div>
            <div className="impact-label">Units Redistributed</div>
          </div>
        </div>
        
        <div className="impact-message">
          <p>
            🌱 <strong>Every donation matters!</strong> Your contributions help reduce food waste 
            and provide nutritious food to communities in need. Keep up the great work!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;