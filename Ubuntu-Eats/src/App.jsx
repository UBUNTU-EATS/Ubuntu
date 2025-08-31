import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/LandingPage";
import DonorDashboard from "./pages/DonorDashboard";
import NGOSignup from "./pages/NGOSignup";
import DonorSignup from "./pages/DonorSignup";

import NGODashboard from "./pages/NGODashboard";

import NGOProfile from "./pages/NGOProfile";
import ClaimedDonations from "./pages/ClaimedDonations";
import FoodReceiver from "./pages/FoodReceiver";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/NGOSignup" element={<NGOSignup />} />
        <Route path="/DonorSignup" element={<DonorSignup />} />
        <Route path="/NGODashboard" element={<NGODashboard />} />
        <Route path="/FoodReceiver" element={<FoodReceiver />} />

        <Route path="/NGOProfile" element={<NGOProfile />} />
        <Route path="/ClaimedDonations" element={<ClaimedDonations />} />
      </Routes>
    </Router>
  );
}

export default App;
