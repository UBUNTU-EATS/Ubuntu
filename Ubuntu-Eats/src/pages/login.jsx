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
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Get user data from Firestore
    const userRef = doc(db, "users", email); // use email as ID
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setError("User data not found.");
      return;
    }

    const userData = userSnap.data();

    // Determine roles from boolean flags
    const roles = [];
    if (userData.isDonor) roles.push("donor");
    if (userData.isRecipient) roles.push("recipient");
    if (userData.isAdmin) roles.push("admin");
    if (userData.isVolunteer) roles.push("volunteer");

    if (!roles.length) {
      setError("No roles assigned. Please contact admin.");
      return;
    }

    // Redirect based on roles
    if (roles.length > 1) {
      navigate("/choicePage", { state: { roles } });
    } else {
      const role = roles[0];
      if (role === "donor") navigate("/donor-dashboard");
      else if (role === "volunteer") navigate("/VolunteerDashboard");
      else if (role === "admin") navigate("/AdminDashboard");
      else if (role === "recipient") navigate("/RecipientDashboard");
      else setError("Unknown role. Please contact admin.");
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
