import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LandingPage.css"; // ✅ reuse same styles

const LandingChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="landingPage">
      {/* ✅ Navbar */}
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

      {/* ✅ Choice Hero Section */}
      <header className="hero">
        <h2>Choose How You Want to Join</h2>
        <p>
          Become part of the UBUNTU-EATS community. Whether you’re donating,
          receiving, or volunteering — together we reduce waste and fight
          hunger.
        </p>
      </header>

      {/* ✅ Options Section */}
      <section className="features">
        <h3>Sign Up Options</h3>
        <div className="feature-list">
          <div className="feature-card">
            <h4>Donor</h4>
            <p>Restaurants, shops, or individuals with surplus food.</p>
            <button
              className="cta-btn"
              onClick={() => navigate("/DonorAuth")}
            >
              Sign up as Donor
            </button>
          </div>

          <div className="feature-card">
            <h4>NGO / Farmer</h4>
            <p>Organizations and farmers who distribute food aid.</p>
            <button className="cta-btn" onClick={() => navigate("/RecipientAuth")}>
              Sign up as NGO / Farmer
            </button>
          </div>

          <div className="feature-card">
            <h4>Volunteer</h4>
            <p>Help us collect and deliver food to those in need.</p>
            <button
              className="cta-btn"
              onClick={() => navigate("/VolunteerSignup")}
            >
              Sign up as Volunteer
            </button>
          </div>
        </div>
      </section>

      {/* ✅ Already have an account */}
      <section className="join">
        <h3>Already have an account?</h3>
        <button className="cta-btn" onClick={() => navigate("/login")}>
          Log In
        </button>
      </section>

      {/* ✅ Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} UBUNTU-EATS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingChoice;
