import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/LandingPage";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import VolunteerProfile from "./pages/VolunteerProfile";
import UnifiedSignup from "./pages/UnifiedSignup";
import MyDeliveries from "./pages/MyDeliveries";
import AvailableDeliveries from "./pages/AvailableDeliveries";

import DonorDashboard from "./pages/DonorDashboard";


import AuthContainer from "./pages/AuthContainer";
import NGODashboard from "./pages/NGODashboard";

import NGOProfile from "./pages/NGOProfile";
import ClaimedDonations from "./pages/ClaimedDonations";
import FoodReceiver from "./pages/FoodReceiver";

import FarmersDashboard from './pages/FarmersDashboard';
import IssuesPage from './pages/IssuePage';


import AdminDashboard from "./pages/AdminDashboard";
import SystemAnalytics from "./pages/SystemAnalytics";
import DonationApprovals from "./pages/DonationApprovals";
import UserManagement from "./pages/UserManagement";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/AuthContainer" element={<AuthContainer />} />
        <Route path="/NGODashboard" element={<NGODashboard />} />
        <Route path="/FoodReceiver" element={<FoodReceiver />} />
        <Route path="/farmers-dashboard" element={<FarmersDashboard />} />
        <Route path="/available-listings-farmers" element={<IssuesPage />} />




        <Route path="/NGOProfile" element={<NGOProfile />} />
        <Route path="/ClaimedDonations" element={<ClaimedDonations />} />

        <Route path="/VolunteerDashboard" element={<VolunteerDashboard />} />
        <Route path="/VolunteerProfile" element={<VolunteerProfile />} />
        <Route path="/UnifiedSignup" element={<UnifiedSignup />} />
        <Route path="/MyDeliveries" element={<MyDeliveries />} />
        <Route path="/AvailableDeliveries" element={<AvailableDeliveries />} />

        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/SystemAnalytics" element={<SystemAnalytics />} />
        <Route path="/DonationApprovals" element={<DonationApprovals />} />
        <Route path="/UserManagement" element={<UserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
