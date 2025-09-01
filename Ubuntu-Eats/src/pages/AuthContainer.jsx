import React, { useState } from "react";
import Login from "./Login";
import UnifiedSignup from "./UnifiedSignup";
import "../styles/Auth.css";

const AuthContainer = () => {
  const [activeForm, setActiveForm] = useState("login");

  const handleShowSignup = () => setActiveForm("signup");
  const handleShowLogin = () => setActiveForm("login");

  return (
    <div className="authentication-page">
      <main className="auth-container">
        {activeForm === "login" && (
          <Login onNoAccountClick={handleShowSignup} />
        )}

        {activeForm === "signup" && (
          <UnifiedSignup onAlreadyHaveAccountClick={handleShowLogin} />
        )}
      </main>
    </div>
  );
};

export default AuthContainer;
