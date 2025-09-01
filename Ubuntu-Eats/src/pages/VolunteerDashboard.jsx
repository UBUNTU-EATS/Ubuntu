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
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import VolunteerProfile from "./VolunteerProfile";
import AvailableDeliveries from "./AvailableDeliveries";
import MyDeliveries from "./MyDeliveries";
import "../styles/VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [volunteerData, setVolunteerData] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // Fetch volunteer data and deliveries
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setUserEmail(user.email);

    // Fetch volunteer profile data
    const fetchVolunteerData = async () => {
      try {
        const userDocRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setVolunteerData(userDoc.data());
        } else {
          console.error("Volunteer data not found for email:", user.email);
        }
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
      }
    };

    // Fetch available deliveries (CLAIMED status with volunteer collection method)
    const availableQuery = query(
      collection(db, "claims"),
      where("collectionMethod", "==", "volunteer"),
      where("volunteerAssigned", "==", null),
      where("status", "==", "CLAIMED")
    );

    const availableUnsubscribe = onSnapshot(
      availableQuery,
      async (snapshot) => {
        const deliveries = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const claimData = {
              claimId: docSnapshot.id,
              ...docSnapshot.data(),
            };

            try {
              // Get the donation data for this claim
              const donationDoc = await getDoc(
                doc(db, "foodListings", claimData.listingId)
              );
              if (donationDoc.exists()) {
                return {
                  ...claimData,
                  ...donationDoc.data(),
                };
              }
              return claimData;
            } catch (error) {
              console.error("Error fetching donation data:", error);
              return claimData;
            }
          })
        );

        setAvailableDeliveries(deliveries);
      }
    );

    // Fetch deliveries assigned to this volunteer
    const myDeliveriesQuery = query(
      collection(db, "claims"),
      where("volunteerAssigned", "==", user.email)
    );

    const myDeliveriesUnsubscribe = onSnapshot(
      myDeliveriesQuery,
      async (snapshot) => {
        const deliveries = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const claimData = {
              claimId: docSnapshot.id,
              ...docSnapshot.data(),
            };

            try {
              // Get the donation data for this claim
              const donationDoc = await getDoc(
                doc(db, "foodListings", claimData.listingId)
              );
              if (donationDoc.exists()) {
                return {
                  ...claimData,
                  ...donationDoc.data(),
                };
              }
              return claimData;
            } catch (error) {
              console.error("Error fetching donation data:", error);
              return claimData;
            }
          })
        );

        setMyDeliveries(deliveries);
        setLoading(false);
      }
    );

    fetchVolunteerData();

    // Cleanup subscriptions
    return () => {
      availableUnsubscribe();
      myDeliveriesUnsubscribe();
    };
  }, []);

  const acceptDelivery = async (claimId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const claimRef = doc(db, "claims", claimId);
      const claimDoc = await getDoc(claimRef);

      if (!claimDoc.exists()) {
        throw new Error("Claim not found");
      }

      // Update claim with volunteer assignment
      await updateDoc(claimRef, {
        volunteerAssigned: user.email,
        volunteerAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Delivery accepted successfully");
    } catch (error) {
      console.error("Error accepting delivery:", error);
      throw error;
    }
  };

  const confirmDelivery = async (claimId, listingId) => {
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
      console.error("Error confirming delivery:", error);
      throw error;
    }
  };

  const cancelDelivery = async (claimId) => {
    try {
      const claimRef = doc(db, "claims", claimId);

      await updateDoc(claimRef, {
        volunteerAssigned: null,
        volunteerAssignedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error canceling delivery:", error);
      throw error;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="volunteer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Volunteer Dashboard</h1>
          <p className="welcome-text">
            Welcome, {volunteerData?.name || userEmail}!
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{availableDeliveries.length}</span>
            <span className="stat-label">Available Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{myDeliveries.length}</span>
            <span className="stat-label">My Deliveries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {myDeliveries.filter((d) => d.status === "COLLECTED").length}
            </span>
            <span className="stat-label">Completed</span>
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
          Available Deliveries ({availableDeliveries.length})
        </button>
        <button
          className={`nav-tab ${activeTab === "myDeliveries" ? "active" : ""}`}
          onClick={() => setActiveTab("myDeliveries")}
        >
          My Deliveries ({myDeliveries.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === "profile" && volunteerData && (
          <VolunteerProfile
            volunteerData={volunteerData}
            setVolunteerData={setVolunteerData}
          />
        )}

        {activeTab === "available" && (
          <AvailableDeliveries
            deliveries={availableDeliveries}
            onAccept={acceptDelivery}
            maxDistance={volunteerData?.maxDistance || "25 km"}
          />
        )}

        {activeTab === "myDeliveries" && (
          <MyDeliveries
            deliveries={myDeliveries}
            onConfirmDelivery={confirmDelivery}
            onCancelDelivery={cancelDelivery}
          />
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;
