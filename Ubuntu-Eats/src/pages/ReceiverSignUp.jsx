import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/ReceiverSignUp.css";

const ReceiverSignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "volunteer",
    organization: "",
    phone: "",
    address: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: formData.name,
      });

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: formData.email,
        name: formData.name,
        userType: formData.userType,
        phone: formData.phone,
        address: formData.address,
        organization: formData.userType === "ngo" ? formData.organization : "",
        description: formData.description || "",
        createdAt: new Date(),
        verified: false,
      };

      await setDoc(doc(db, "users", user.uid), userDoc);

      // Navigate to receiver dashboard
      navigate("/receiver-dashboard");
    } catch (error) {
      console.error("Sign up error:", error);

      // More specific error messages
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (error.code === "auth/operation-not-allowed") {
        setError(
          "Email/password accounts are not enabled. Please contact support."
        );
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (
        error.code ===
        "auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked"
      ) {
        setError(
          "Sign-up is currently disabled. Please try again later or contact support."
        );

        // Fallback: Store user data in localStorage for demo purposes
        localStorage.setItem("demoUser", JSON.stringify(formData));
        alert("Demo mode: Account created locally (Firebase sign-up disabled)");
        navigate("/receiver-dashboard");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo mode check
  const isDemoMode = error.includes("Sign-up is currently disabled");

  return (
    <div className="signup-container">
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

      <div className="signup-form-container">
        <div className="signup-form">
          <h2>Create Receiver Account</h2>
          <p>Join as an NGO or volunteer to receive food donations</p>

          {error && (
            <div
              className={`error-message ${isDemoMode ? "demo-warning" : ""}`}
            >
              {error}
              {isDemoMode && (
                <p style={{ marginTop: "10px", fontSize: "14px" }}>
                  You can still explore the app in demo mode.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userType">I am signing up as *</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="volunteer">Volunteer</option>
                <option value="ngo">NGO/Organization</option>
              </select>
            </div>

            {formData.userType === "ngo" && (
              <div className="form-group">
                <label htmlFor="organization">Organization Name *</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  required={formData.userType === "ngo"}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                {formData.userType === "ngo"
                  ? "Tell us about your organization"
                  : "Tell us about yourself"}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="What motivates you to help reduce food waste?"
              ></textarea>
            </div>

            <button type="submit" disabled={loading} className="signup-btn">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="login-link">
            Already have an account?{" "}
            <Link to="/receiver-login">Sign in here</Link>
          </p>
        </div>

        <div className="signup-benefits">
          <h3>Why Join as a Receiver?</h3>
          <div className="benefit-item">
            <h4>🔄 Access Surplus Food</h4>
            <p>
              Connect with local businesses and receive quality surplus food
            </p>
          </div>
          <div className="benefit-item">
            <h4>📍 Real-Time Notifications</h4>
            <p>Get instant alerts when new donations are available nearby</p>
          </div>
          <div className="benefit-item">
            <h4>🤝 Make an Impact</h4>
            <p>Help reduce food waste while supporting your community</p>
          </div>
          <div className="benefit-item">
            <h4>📊 Track Your Impact</h4>
            <p>Monitor how much food you've saved and distributed</p>
          </div>

          {/* Demo mode notice */}
          {isDemoMode && (
            <div className="benefit-item demo-notice">
              <h4>⚠️ Demo Mode Active</h4>
              <p>
                Firebase authentication is currently disabled. You can still
                explore the app's features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiverSignUp;
