import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/LandingPage";
import { ReceiverLogin } from "./pages/ReceiverLogin";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import ReceiverSignUp from "./pages/ReceiverSignUp";
import VolunteerDashboard from "./pages/VolunteerDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />

        <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
        <Route path="/receiver-login" element={<ReceiverLogin />} />
        <Route path="/receiver-signup" element={<ReceiverSignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
