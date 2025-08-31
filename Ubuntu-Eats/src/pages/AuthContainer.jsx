import React, { useState } from "react";
import Login from "./Login";
import UnifiedSignup from "./UnifiedSignup";
import "../styles/Auth.css";

const AuthContainer = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  const handleCreateAccountClick = () => {
    setShowSignup(true);
    setShowLogin(false);
  };

  const handleAlreadyHaveAccountClick = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <main className="auth-container">
      {showLogin && <Login onCreateAccountClick={handleCreateAccountClick} />}
      {showSignup && (
        <UnifiedSignup
          onAlreadyHaveAccountClick={handleAlreadyHaveAccountClick}
        />
      )}
    </main>
  );
};

export default AuthContainer;
