import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Login = ({ onCreateAccountClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check account type in Firestore
      let accountType = null;

      // Check in donors collection
      const donorDoc = await getDoc(doc(db, "donors", user.uid));
      if (donorDoc.exists()) {
        accountType = donorDoc.data().accountType;
      }

      // If not found in donors, check in ngos collection
      if (!accountType) {
        const ngoDoc = await getDoc(doc(db, "ngos", user.uid));
        if (ngoDoc.exists()) {
          accountType = "ngo";
        }
      }

      // If not found in ngos, check in farmers collection
      if (!accountType) {
        const farmerDoc = await getDoc(doc(db, "farmers", user.uid));
        if (farmerDoc.exists()) {
          accountType = "farmer";
        }
      }

      // If not found in farmers, check in volunteers collection
      if (!accountType) {
        const volunteerDoc = await getDoc(doc(db, "volunteers", user.uid));
        if (volunteerDoc.exists()) {
          accountType = "volunteer";
        }
      }

      // Redirect based on account type
      if (accountType) {
        switch (accountType) {
          case "individual":
          case "company":
            navigate("/donor-dashboard");
            break;
          case "ngo":
            navigate("/NGODashboard");
            break;
          case "farmer":
            navigate("/NGODashboard");
            break;
          case "volunteer":
            navigate("/VolunteerDashboard");
            break;
          default:
            navigate("/LandingPage");
        }
      } else {
        setError("Account type not found. Please contact support.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="login-container">
      <h2 className="login-title">Login</h2>
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
        <button type="submit" className="login-submit">
          Login
        </button>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="google-signin"
        >
          <img
            src="https://th.bing.com/th/id/OIP.Din44az7iZZDfbsrD1kfGQHaHa?rs=1&pid=ImgDetMain"
            alt="Google Logo"
          />
          Sign in with Google
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
      <section className="no-account">
        <p>
          Don't have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onCreateAccountClick();
            }}
            className="to-signup"
          >
            Create an account
          </a>
        </p>
      </section>
    </section>
  );
};

export default Login;
