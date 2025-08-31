import RSignUp from "./RSignup";
import Login from "./login";
import { useState } from "react";
import "../styles/Auth.css";

const RAuth = () => {
  const [showLogin, setShowLogin] = useState(false); 
  const [showSignup, setShowSignup] = useState(true);

  const handleCreateAccountClick = () => {
    setShowSignup(true);
    setShowLogin(false); 
  };
  
  const handleAlreadyHaveAccountClick = () => {
    setShowSignup(false);
    setShowLogin(true);
  };
  
  return (
    <main className="authentication-page">
      {showLogin && (
        <Login
          isActive={showLogin}
          onCreateAccountClick={handleCreateAccountClick}
        />
      )}
      {showSignup && (
        <RSignUp
          isActive={showSignup}
          onAlreadyHaveAccountClick={handleAlreadyHaveAccountClick}
        />
      )}
    </main>
  );
};

export default RAuth;