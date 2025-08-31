import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import app from "../firebase";
import "../styles/ReceiverDashboard.css";

const ReceiverDashboard = () => {
  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [view, setView] = useState("list");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firestore and Auth
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Mock data for food listings
  const mockFoodListings = [
    {
      id: "1",
      title: "Fresh Sandwiches & Salads",
      description: "20 lunch boxes from today's service, perfectly fresh",
      category: "fresh-meals",
      quantity: 20,
      weightKg: 8,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      donorName: "City Cafe",
      pickupAddress: "123 Main Street, Downtown",
      status: "available",
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FuZHdpY2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Assorted Pastries",
      description: "Day-old pastries still fresh and delicious",
      category: "bakery",
      quantity: 15,
      weightKg: 5,
      expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      donorName: "The Sweet Bakery",
      pickupAddress: "456 Oak Avenue, Midtown",
      status: "available",
      imageUrl:
        "https://images.unsplash.com/photo-1555507036-ab794f24d8c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGFzdHJ5fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
    {
      id: "3",
      title: "Mixed Vegetables",
      description: "Fresh surplus vegetables from today's delivery",
      category: "produce",
      quantity: 30,
      weightKg: 12,
      expiryTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
      donorName: "Green Grocers",
      pickupAddress: "789 Market Street, Uptown",
      status: "available",
      imageUrl:
        "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmVnZXRhYmxlc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
    {
      id: "4",
      title: "Dairy Products",
      description: "Milk, cheese, and yogurt with 2 days until expiry",
      category: "dairy",
      quantity: 25,
      weightKg: 10,
      expiryTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
      donorName: "Fresh Mart",
      pickupAddress: "321 Dairy Lane, Westside",
      status: "available",
      imageUrl:
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGRhaXJ5JTIwcHJoZHVjdHN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
    {
      id: "5",
      title: "Packaged Snacks",
      description: "Assorted packaged snacks and canned goods",
      category: "packaged",
      quantity: 50,
      weightKg: 15,
      expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      donorName: "Super Save Market",
      pickupAddress: "654 Retail Road, East End",
      status: "available",
      imageUrl:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JvY2VyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
    {
      id: "6",
      title: "Bread and Rolls",
      description: "Freshly baked bread from this morning",
      category: "bakery",
      quantity: 40,
      weightKg: 8,
      expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      donorName: "Bakery Delight",
      pickupAddress: "987 Bread Street, Northside",
      status: "claimed",
      imageUrl:
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YnJlYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
      createdAt: new Date(),
    },
  ];

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "fresh-meals", name: "Fresh Meals" },
    { id: "bakery", name: "Bakery" },
    { id: "produce", name: "Produce" },
    { id: "dairy", name: "Dairy" },
    { id: "packaged", name: "Packaged Foods" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchFoodListings();
      } else {
        // For demo purposes, set loading to false but don't set mock data yet
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFoodListings = () => {
    const q = query(
      collection(db, "foodListings"),
      where("status", "==", "available"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const listingsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to JavaScript Date if needed
          const listing = {
            id: doc.id,
            ...data,
            expiryTime: data.expiryTime?.toDate?.() || data.expiryTime,
          };
          listingsData.push(listing);
        });

        setListings(listingsData);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  const handleClaim = async (listingId) => {
    if (!user) {
      alert("Please sign in to claim food donations");
      return;
    }

    try {
      // For demo purposes with mock data, update local state
      if (
        listingId.startsWith("mock-") ||
        mockFoodListings.some((item) => item.id === listingId)
      ) {
        setListings((prevListings) =>
          prevListings.map((listing) =>
            listing.id === listingId
              ? { ...listing, status: "claimed" }
              : listing
          )
        );
        alert("Food listing claimed successfully! We've notified the donor.");
        return;
      }

      // Update the listing status to 'claimed' in Firebase
      const listingRef = doc(db, "foodListings", listingId);
      await updateDoc(listingRef, {
        status: "claimed",
        claimedById: user.uid,
        claimedAt: new Date(),
      });

      // Create a claim record
      const claimsRef = collection(db, "foodListings", listingId, "claims");
      await addDoc(claimsRef, {
        claimedById: user.uid,
        claimedByName: user.displayName || user.email,
        status: "scheduled",
        claimedAt: new Date(),
      });

      alert("Food listing claimed successfully! We've notified the donor.");
    } catch (error) {
      console.error("Error claiming food: ", error);
      alert("Error claiming food. Please try again.");
    }
  };

  // Determine which listings to display based on view
  const displayListings =
    view === "list"
      ? selectedCategory === "all"
        ? listings
        : listings.filter((listing) => listing.category === selectedCategory)
      : [];

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out");
      })
      .catch((error) => {
        console.error("Sign out error: ", error);
      });
  };

  if (loading) {
    return (
      <div className="receiver-dashboard">
        <nav className="navbar">
          <Link to="/" className="logo">
            UBUNTU-EATS
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/donor-form">Become a Donor</Link>
            <Link to="/receiver-login">Sign In</Link>
          </div>
        </nav>

        <div className="dashboard-header">
          <h1>Available Food Donations</h1>
          <p>
            Claim surplus food from local businesses and help distribute it to
            those in need
          </p>

          <div className="controls">
            <div className="view-toggle">
              <button
                className={view === "map" ? "active" : ""}
                onClick={() => setView("map")}
              >
                Map View
              </button>
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
              >
                List View
              </button>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="loading">Loading available donations...</div>
      </div>
    );
  }

  return (
    <div className="receiver-dashboard">
      <nav className="navbar">
        <Link to="/" className="logo">
          UBUNTU-EATS
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/donor-form">Become a Donor</Link>
          {user ? (
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          ) : (
            <Link to="/receiver-login">Sign In</Link>
          )}
        </div>
      </nav>

      <div className="dashboard-header">
        <h1>Available Food Donations</h1>
        <p>
          Claim surplus food from local businesses and help distribute it to
          those in need
        </p>

        <div className="controls">
          <div className="view-toggle">
            <button
              className={view === "map" ? "active" : ""}
              onClick={() => setView("map")}
            >
              Map View
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              List View
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "list" ? (
        <div className="listings-container">
          {/* Show mock data only if no real data exists */}
          {(displayListings.length > 0
            ? displayListings
            : mockFoodListings
          ).map((listing) => (
            <div key={listing.id} className="food-card">
              <div className="food-image">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} />
                ) : (
                  <div className="image-placeholder">No Image</div>
                )}
              </div>

              <div className="food-details">
                <h3>{listing.title}</h3>
                <p className="description">{listing.description}</p>

                <div className="food-meta">
                  <span className="quantity">{listing.quantity} items</span>
                  <span className="weight">({listing.weightKg} kg)</span>
                  <span className="category">{listing.category}</span>
                </div>

                <div className="donor-info">
                  <strong>{listing.donorName}</strong>
                  <p>{listing.pickupAddress}</p>
                </div>

                <div className="expiry">
                  Expires:{" "}
                  {listing.expiryTime
                    ? new Date(listing.expiryTime).toLocaleString()
                    : "N/A"}
                </div>
              </div>

              <div className="food-actions">
                <button
                  onClick={() => handleClaim(listing.id)}
                  className="claim-btn"
                  disabled={listing.status !== "available"}
                >
                  {listing.status === "available" ? "Claim Now" : "Claimed"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="map-view">
          <p>Map view would show available donations geographically</p>
          <div className="map-placeholder">
            <p>Interactive Map Here</p>
            <p>(Would show pins for each available food donation)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverDashboard;
