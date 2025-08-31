import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/LandingPage";
import LandingChoice from "./pages/LandingChoice";
import DonorDashboard from "./pages/DonorDashboard";
import RAuth from "./pages/RAuth";
import DonorAuth from "./pages/DonorAuth";

import NGODashboard from "./pages/NGODashboard";

import NGOProfile from "./pages/NGOProfile";
import ClaimedDonations from "./pages/ClaimedDonations";
import FoodReceiver from "./pages/FoodReceiver";

import VolunteerDashboard from "./pages/VolunteerDashboard";
import VolunteerSignup from "./pages/VolunteerSignup";
import VolunteerProfile from "./pages/VolunteerProfile";
import MyDeliveries from "./pages/MyDeliveries";
import AvailableDeliveries from "./pages/AvailableDeliveries";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/LandingChoice" element={<LandingChoice />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/RecipientAuth" element={<RAuth />} />
        <Route path="/DonorAuth" element={<DonorAuth />} />
        <Route path="/NGODashboard" element={<NGODashboard />} />
        <Route path="/FoodReceiver" element={<FoodReceiver />} />

        <Route path="/NGOProfile" element={<NGOProfile />} />
        <Route path="/ClaimedDonations" element={<ClaimedDonations />} />

        <Route path="/VolunteerDashboard" element={<VolunteerDashboard />} />
        <Route path="/VolunteerProfile" element={<VolunteerProfile />} />
        <Route path="/VolunteerSignup" element={<VolunteerSignup />} />
        <Route path="/MyDeliveries" element={<MyDeliveries />} />
        <Route path="/AvailableDeliveries" element={<AvailableDeliveries />} />
      </Routes>
    </Router>
  );
}

export default App;
