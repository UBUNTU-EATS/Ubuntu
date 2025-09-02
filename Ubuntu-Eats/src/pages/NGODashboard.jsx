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
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import NGOProfile from "./NGOProfile";
import AvailableDonations from "./AvailableDonations";
import ClaimedDonations from "./ClaimedDonations";
import "../styles/NGODashboard.css";

const NGODashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [ngoData, setNgoData] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [claimedDonations, setClaimedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // Fetch NGO data and donations
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setUserEmail(user.email);

    // Fetch NGO profile data
    const fetchNGOData = async () => {
      try {
        const userDocRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setNgoData(userDoc.data());
        } else {
          console.error("NGO data not found for email:", user.email);
        }
      } catch (error) {
        console.error("Error fetching NGO data:", error);
      }
    };

    // Fetch available donations (UNCLAIMED status)
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

    // Fetch claimed donations by this NGO
    const claimedQuery = query(
      collection(db, "claims"),
      where("ngoEmail", "==", user.email)
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
      setLoading(false);
    });

    fetchNGOData();

    // Cleanup subscriptions
    return () => {
      availableUnsubscribe();
      claimedUnsubscribe();
    };
  }, []);

  const claimDonation = async (donationId, collectionMethod) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const donationRef = doc(db, "foodListings", donationId);
      const donationDoc = await getDoc(donationRef);

      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }

      const donationData = donationDoc.data();

      // Get NGO name from ngoData or use a fallback
      let ngoName = "Unknown NGO";
      if (ngoData) {
        ngoName =
          ngoData.name ||
          ngoData.contactPerson ||
          ngoData.companyName ||
          "Unknown NGO";
      }

      // Create claim record - ensure collectionMethod is not undefined
      const claimData = {
        listingId: donationId,
        ngoId: user.uid,
        ngoEmail: user.email,
        ngoName: ngoName,
        claimDate: serverTimestamp(),
        status: "CLAIMED",
        collectionMethod: collectionMethod || "pending", // Default to "pending" if undefined
        volunteerAssigned: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "claims"), claimData);

      // Update donation status
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="ngo-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">NGO Dashboard</h1>
          <p className="welcome-text">
            Welcome, {ngoData?.name || ngoData?.contactPerson || userEmail}!
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
        {activeTab === "profile" && ngoData && (
          <NGOProfile ngoData={ngoData} setNgoData={setNgoData} />
        )}

        {activeTab === "available" && (
          <AvailableDonations
            donations={availableDonations}
            onClaim={claimDonation}
          />
        )}

        {activeTab === "claimed" && (
          <ClaimedDonations
            donations={claimedDonations}
            onSetCollectionMethod={setCollectionMethod}
            onConfirmCollection={confirmCollection}
            onCancelClaim={cancelClaim}
          />
        )}
      </main>
    </div>
  );
};

export default NGODashboard;
