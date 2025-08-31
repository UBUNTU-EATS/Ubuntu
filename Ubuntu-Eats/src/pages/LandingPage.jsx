import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="navbar">
        <h1 className="logo">UBUNTU-EATS</h1>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <Link
            to="/donor-dashboard"
            style={{ color: "white", textDecoration: "none" }}
          >
            Donor Portal
          </Link>
          <a href="#join">Get Started</a>
        </div>
      </nav>

      <header className="hero">
        <h2>Turning Food Waste into Food Aid</h2>
        <p>
          UBUNTU-EATS connects restaurants, supermarkets, and households with
          NGOs and volunteers to redistribute surplus food in real time.
          Together, we can fight hunger and reduce waste.
        </p>

        <button
          className="cta-btn"
          onClick={() => navigate("/donor-dashboard")}
        >
          Join the Movement
        </button>
      </header>

      <section id="features" className="features">
        <h3>How It Works</h3>
        <div className="feature-list">
          <div className="feature-card">
            <h4>1. Post Surplus Food</h4>
            <p>
              Restaurants and shops upload food they can't sell but is still
              good.
            </p>
          </div>
          <div className="feature-card">
            <h4>2. Find & Claim</h4>
            <p>
              NGOs and volunteers see available food nearby and claim it
              instantly.
            </p>
          </div>
          <div className="feature-card">
            <h4>3. Deliver Help</h4>
            <p>
              Food gets picked up by the NGOs or Volunteers and gets distributed
              to those in need.
            </p>
          </div>
        </div>
      </section>

      <section id="join" className="join">
        <h3>Be Part of the Change</h3>
        <p>Sign up today and help us provide meals, one pickup at a time.</p>
        <Link to="/RecipientAuth">
          <button className="cta-btn">Get Started</button>
        </Link>

        <Link to="/RAuth">
          <button className="cta-btn">Donor startup</button>
        </Link>

        <Link to="/AuthContainer">
          <button className="cta-btn">AuthContainer</button>
        </Link>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} UBUNTU-EATS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
