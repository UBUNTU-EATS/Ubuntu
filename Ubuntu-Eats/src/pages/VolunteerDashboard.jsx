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
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import VolunteerProfile from "./VolunteerProfile";
import AvailableDeliveries from "./AvailableDeliveries";
import MyDeliveries from "./MyDeliveries";
import LoadingDots from "./loading";
import "../styles/VolunteerDashboard.css";

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [volunteerData, setVolunteerData] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  // Wait for Firebase Auth to initialize before fetching volunteer data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthLoading(false);
      if (user) {
        fetchVolunteerData(user);
      } else {
        navigate("/"); // Redirect if not authenticated
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, [navigate]);

  // Fetch volunteer data and set up real-time listeners
  const fetchVolunteerData = async (user) => {
    try {
      setLoading(true);
      setUserEmail(user.email);

      // Fetch volunteer profile data
      const userDocRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === "volunteer") {
          setVolunteerData(data);
        } else {
          console.warn("This user is not a volunteer.");
          navigate("/"); // Redirect if not a volunteer
          return;
        }
      } else {
        console.error("Volunteer data not found for email:", user.email);
        navigate("/"); // Redirect if no data
        return;
      }

      // Set up real-time listeners for deliveries
      setupDeliveryListeners(user.email);

    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      navigate("/"); // Redirect on error
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listeners for deliveries
  const setupDeliveryListeners = (userEmail) => {
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
      collection(db, "deliveryAssignments"),
      where("volunteerEmail", "==", userEmail)
    );

    const myDeliveriesUnsubscribe = onSnapshot(
      myDeliveriesQuery,
      async (snapshot) => {
        const deliveries = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const deliveryData = {
              deliveryId: docSnapshot.id,
              ...docSnapshot.data(),
            };

            try {
              // Get the claim data for this delivery
              const claimDoc = await getDoc(
                doc(db, "claims", deliveryData.claimId)
              );

              // Get the donation data for this claim
              const donationDoc = await getDoc(
                doc(db, "foodListings", deliveryData.listingId)
              );

              let combinedData = { ...deliveryData };

              if (claimDoc.exists()) {
                const claimData = claimDoc.data();
                // Rename conflicting fields from claims to avoid overriding delivery status
                combinedData = {
                  ...combinedData,
                  claimStatus: claimData.status, // Rename claims status
                  claimCollectionMethod: claimData.collectionMethod,
                  claimedBy: claimData.claimedBy,
                  claimedByEmail: claimData.claimedByEmail,
                  claimedAt: claimData.claimedAt,
                  // Don't spread the entire claimData to avoid status override
                };
              }

              if (donationDoc.exists()) {
                const donationData = donationDoc.data();
                // Rename conflicting fields from donations to avoid overriding delivery status
                combinedData = {
                  ...combinedData,
                  listingStatus: donationData.listingStatus, // Keep this as is
                  ...donationData,
                  // Preserve delivery status by re-setting it after spread
                  status: deliveryData.status, // Keep delivery status as primary
                };
              }

              return combinedData;
            } catch (error) {
              console.error("Error fetching claim or donation data:", error);
              return deliveryData;
            }
          })
        );

        setMyDeliveries(deliveries);
      }
    );

    // Store cleanup functions
    window.volunteerListenerCleanup = () => {
      availableUnsubscribe();
      myDeliveriesUnsubscribe();
    };
  };

  // Cleanup listeners on component unmount
  useEffect(() => {
    return () => {
      if (window.volunteerListenerCleanup) {
        window.volunteerListenerCleanup();
      }
    };
  }, []);

  const acceptDelivery = async (claimId, listingId, ngoEmail, ngoName) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const claimRef = doc(db, "claims", claimId);
      const claimDoc = await getDoc(claimRef);

      if (!claimDoc.exists()) {
        throw new Error("Claim not found");
      }

      // Create a delivery assignment document
      const deliveryAssignment = {
        claimId: claimId,
        listingId: listingId,
        volunteerId: user.uid,
        volunteerEmail: user.email,
        volunteerName: volunteerData?.name || user.displayName || "Volunteer",
        ngoEmail: ngoEmail,
        ngoName: ngoName,
        status: "ASSIGNED",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to deliveryAssignments collection
      await addDoc(collection(db, "deliveryAssignments"), deliveryAssignment);

      // Update the claim with volunteer assignment
      await updateDoc(claimRef, {
        volunteerAssigned: user.email,
        volunteerAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Delivery accepted successfully");
      return true;
    } catch (error) {
      console.error("Error accepting delivery:", error);
      throw error;
    }
  };

  // Separate function for confirming pickup (ASSIGNED → PICKED_UP)
  const confirmPickup = async (deliveryId, claimId, listingId) => {
    try {
      const deliveryRef = doc(db, "deliveryAssignments", deliveryId);

      // Update delivery status to PICKED_UP
      await updateDoc(deliveryRef, {
        status: "PICKED_UP",
        pickedUpAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Pickup confirmed successfully");
    } catch (error) {
      console.error("Error confirming pickup:", error);
      throw error;
    }
  };

  // Separate function for completing delivery (PICKED_UP → DELIVERED)
  const completeDelivery = async (deliveryId, claimId, listingId) => {
    try {
      const deliveryRef = doc(db, "deliveryAssignments", deliveryId);
      const claimRef = doc(db, "claims", claimId);
      const listingRef = doc(db, "foodListings", listingId);

      // Update delivery status to DELIVERED
      await updateDoc(deliveryRef, {
        status: "DELIVERED",
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update claim status to COLLECTED
      await updateDoc(claimRef, {
        status: "COLLECTED",
        collectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update listing status to COLLECTED
      await updateDoc(listingRef, {
        listingStatus: "COLLECTED",
        updatedAt: serverTimestamp(),
      });

      console.log("Delivery completed successfully");
    } catch (error) {
      console.error("Error completing delivery:", error);
      throw error;
    }
  };

  // Improved cancel delivery function
  const cancelDelivery = async (deliveryId, claimId) => {
    try {
      const deliveryRef = doc(db, "deliveryAssignments", deliveryId);
      const claimRef = doc(db, "claims", claimId);

      // Update delivery assignment status to CANCELLED
      await updateDoc(deliveryRef, {
        status: "CANCELLED",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Remove volunteer assignment from claim and reset to CLAIMED status
      await updateDoc(claimRef, {
        volunteerAssigned: null,
        volunteerAssignedAt: null,
        status: "CLAIMED", // Reset to allow other volunteers to pick it up
        updatedAt: serverTimestamp(),
      });

      console.log("Delivery cancelled successfully");
    } catch (error) {
      console.error("Error canceling delivery:", error);
      throw error;
    }
  };

  // Show loading while waiting for auth state
  if (authLoading) {
    return (
      <section className="loading">
        <LoadingDots numIcons={7} radius={60} speed={0.6} size={20} />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="loading">
        <LoadingDots numIcons={7} radius={60} speed={0.6} size={20} />
      </section>
    );
  }

  if (!volunteerData) {
    return (
      <div className="dashboard-error">
        Error loading dashboard data. Please try again later.
      </div>
    );
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
          <button
            className="logout-btn"
            onClick={async () => {
              await auth.signOut();
              navigate("/");
            }}
          >
            Logout
          </button>
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
              {myDeliveries.filter((d) => d.status === "DELIVERED").length}
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
          {/* Add notification badge for active deliveries */}
          {myDeliveries.filter(d => d.status === "ASSIGNED" || d.status === "PICKED_UP").length > 0 && (
            <span className="notification-badge">
              {myDeliveries.filter(d => d.status === "ASSIGNED" || d.status === "PICKED_UP").length}
            </span>
          )}
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
            onConfirmDelivery={confirmPickup}
            onCancelDelivery={cancelDelivery}
            onCompleteDelivery={completeDelivery}
          />
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;