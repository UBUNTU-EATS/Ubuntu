import React, { useState } from "react";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/donor-dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      navigate("/home");
      const user = result.user;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during Google sign-in");
      }
    }
  };

  return (
    <section className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          test-id="email-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-email"
        />
        <input
          test-id="password-input"
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