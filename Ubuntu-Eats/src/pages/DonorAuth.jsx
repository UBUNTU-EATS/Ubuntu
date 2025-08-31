import DSignUp from "./Dsignup";
import Login from "./login";
import { useState } from "react";
import "../styles/Auth.css";

const DonorAuth = () => {
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
      {showLogin && (
        <Login
          isActive={showLogin}
          onCreateAccountClick={handleCreateAccountClick}
        />
      )}
      {showSignup && (
        <DSignUp
          isActive={showSignup}
          onAlreadyHaveAccountClick={handleAlreadyHaveAccountClick}
        />
      )}
    </main>
  );
};

export default DonorAuth;