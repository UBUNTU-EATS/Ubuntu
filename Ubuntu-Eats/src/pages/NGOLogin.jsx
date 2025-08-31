import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const NGOLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Hook into Firebase Auth or backend API
    console.log("Login attempt:", { email, password });
    alert("Login successful (mock). Redirecting to NGO Dashboard...");
    navigate("/ngo-dashboard");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>NGO Login</h2>
        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="cta-btn">
            Login
          </button>
        </form>

        <p>
          Don’t have an account? <Link to="/ngo-signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default NGOLogin;
