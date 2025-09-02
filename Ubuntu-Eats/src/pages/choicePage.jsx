import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/choicePage.css";

const ChoicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roles = [] } = location.state || {}; // get roles from state

  const handleNavigation = (role) => {
    if (role === "donor") {
      navigate("/donor-dashboard");
    } else if (role === "volunteer") {
      navigate("/VolunteerDashboard");
    } else if (role === "recipient") {
      navigate("/NGODashboard");
    } else if (role === "admin") {
      navigate("/AdminDashboard");
    }
  };

  return (
    <section className="choice-page">
      <header className="choice-header">
        <h2>Choose Your Dashboard</h2>
        <p>You have multiple roles. Select the dashboard you’d like to access.</p>
      </header>

      <section className="roles-grid">
        {roles.length > 0 ? (
          roles.map((role, index) => (
            <div
              key={index}
              className="role-card"
              onClick={() => handleNavigation(role)}
            >
              <h3 className="role-title">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </h3>
              <p className="role-desc">
                {role === "farmer" &&
                  "Manage your produce donations and requests."}
                {role === "company" &&
                  "Oversee your company’s food contributions."}
                {role === "individual" &&
                  "Track and manage your individual donations."}
                {role === "volunteer" &&
                  "Accept deliveries and manage your tasks."}
                {role === "ngo" &&
                  "Organize donations and distribute to communities."}
              </p>
              <button onClick={() => handleNavigation(role)} className="select-btn">Go to {role} Dashboard</button>
            </div>
          ))
        ) : (
          <p>No roles assigned. Please contact admin.</p>
        )}
      </section>
    </section>
  );
};

export default ChoicePage;
