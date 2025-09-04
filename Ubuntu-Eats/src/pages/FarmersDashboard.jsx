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

  // Fetch farmer data and donations - following NGO pattern exactly
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

      // Fetch claimed donations by this farmer - same pattern as NGO
      const claimedQuery = query(
        collection(db, "claims"),
        where("farmerEmail", "==", user.email)
      );

      const claimedUnsubscribe = onSnapshot(claimedQuery, async (snapshot) => {
        const claims = snapshot.docs.map((doc) => ({
          claimId: doc.id,
          ...doc.data(),
        }));

        // Get the actual donation data for each claim - same as NGO
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
        setLoading(false);
      });

      // Store unsubscribe functions for cleanup
      return () => {
        availableUnsubscribe();
        claimedUnsubscribe();
      };
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      navigate("/");
      setLoading(false);
    }
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
        status: "CLAIMED", // Farmers go directly to CLAIMED
        collectionMethod: collectionMethod || "self", // Farmers typically collect themselves
        volunteerAssigned: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "claims"), claimData);

      // Update donation status - same as NGO
      await updateDoc(donationRef, {
        listingStatus: "CLAIMED",
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

  // Set collection method - following NGO pattern
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

  // Confirm collection - following NGO pattern
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

  // Cancel claim - following NGO pattern
  const cancelClaim = async (claimId, listingId) => {
    try {
      const claimRef = doc(db, "claims", claimId);
      const listingRef = doc(db, "foodListings", listingId);

      // Update claim status
      await updateDoc(claimRef, {
        status: "CANCELLED",
        updatedAt: serverTimestamp(),
      });

      // Reset donation status - ensure we're using the correct field names
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
            <span className="stat-label">Claimed Donations</span>
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
          Available Donations ({availableDonations.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "claimed" ? "active" : ""}`}
          onClick={() => setActiveTab("claimed")}
        >
          My Claims ({claimedDonations.length})
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
      </main>
    </div>
  );
};

export default FarmerDashboard;