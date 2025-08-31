// FarmersDashboard.jsx
import "../styles/FarmersDashboard.css";
import { useNavigate, Navigate } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import React, { useState } from "react";

export default function FarmersDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    navigate("/");
  };

  const token = localStorage.getItem("authToken");
  const userType = localStorage.getItem("userType");
  const isAuthenticated = token && userType === "farmer";

//  if (!isAuthenticated) {
//    return <Navigate to="/" replace />;
//  }

  return (
    <main className="container">
      <header className="header facility-header">
        <section className="header-content">
          <section className="staff-icon">
            <FaLeaf />
          </section>
          <section>
            <h1 className="facility-title">Welcome, Farmer!</h1>
            <p className="facility-subtitle">
              Browse and claim available food donations for your farm
            </p>
          </section>
        </section>
      </header>




      <section className="card-grid">
        <article className="facility-card card-availability">
          <section className="card-icon">
            <FaLeaf />
          </section>
          <h2 className="card-title">Available Food Listings</h2>
          <p className="card-description">
            See all food donations from supermarkets and restaurants near you.
          </p>
          <button
            className="facility-btn"
            onClick={() => handleNavigate("/available-listings-farmers")}
            role="button"
            aria-label="View available food"
          >
            View Listings
          </button>
        </article>
      </section>

      
    </main>
  );
}
