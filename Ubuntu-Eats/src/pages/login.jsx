import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "../styles/login.css";

const Login = ({ isActive, onNoAccountClick }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // Sign in with Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);

    // Get user data from Firestore
    const userRef = doc(db, "users", email); // using email as doc ID
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setError("User data not found.");
      return;
    }

    const userData = userSnap.data();
    
    // Check status first
    if (userData.status === "pending") {
      alert("Awaiting Admin approval");
      return; // stop login flow
    }

    const role = userData.role; // role is now a single field

    // Redirect based on role
    switch (role) {
      case "individual":
      case "company":
        navigate("/donor-dashboard");
        break;
      case "volunteer":
        navigate("/VolunteerDashboard");
        break;
      case "admin":
        navigate("/AdminDashboard");
        break;
      case "ngo":
        navigate("/NGODashboard");
        break;
      case "farmer":
        navigate("/farmers-dashboard");
        break;
      default:
        setError("Unknown role. Please contact admin.");
        break;
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <section className="login-container">
      <h2 className="login-title">Login</h2>
      {error && <p className="login-error">{error}</p>}

      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-password"
        />

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="no-account">
        Don’t have an account?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNoAccountClick();
          }}
        >
          Sign Up
        </a>
      </p>
    </section>
  );
};

export default Login;
