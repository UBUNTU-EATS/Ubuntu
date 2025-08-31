import SignUp from "./Dsignup";
import Login from "./Dlogin";
import { useState } from "react";
import "../styles/Auth.css";

const RAuth = () => {
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
    <main className="authentication-page">
      {showLogin && (
        <Login
          isActive={showLogin}
          onCreateAccountClick={handleCreateAccountClick}
        />
      )}
      {showSignup && (
        <SignUp
          isActive={showSignup}
          onAlreadyHaveAccountClick={handleAlreadyHaveAccountClick}
        />
      )}
    </main>
  );
};

export default RAuth;