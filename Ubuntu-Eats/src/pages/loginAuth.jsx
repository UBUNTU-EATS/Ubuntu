import Login from "./login";
import { useState } from "react";
import "../styles/Auth.css";

const LoginAuth = () => {
  const [showLogin, setShowLogin] = useState(true); 
  const handleCreateAccountClick = () => {
    setShowSignup(true);
    setShowLogin(false); 
  };
  
  return (
    <main className="auth-container">
      {showLogin && (
        <Login
          isActive={showLogin}
          onCreateAccountClick={handleCreateAccountClick}
        />
      )}
    </main>
  );
};

export default LoginAuth;