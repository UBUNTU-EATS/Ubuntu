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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const role = userData.role;

        if (role === "individual" || role === "company" || role === "farmer") {
          navigate("/donor-dashboard");
        } else if (role === "volunteer") {
          navigate("/VolunteerDashboard");
        } else if (role === "ngo") {
          navigate("/NGODashboard");
        } else {
          setError("Unknown role. Please contact admin.");
        }
      } else {
        setError("User data not found.");
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
      onNoAccountClick(); // triggers parent to switch form
    }}
  >
    Sign Up
  </a>
</p>

    </section>
  );
};

export default Login;
