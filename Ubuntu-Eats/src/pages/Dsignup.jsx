// DSignUp.jsx
import React, { useState } from "react";
import "../styles/signup.css";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const DSignUp = ({ onAlreadyHaveAccountClick }) => {
  const [donorType, setDonorType] = useState("individual");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    country: "",
    preferredDonationType: "",
    idNumber: "",
    companyName: "",
    companyRegNumber: "",
    companyWebsite: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDonorTypeChange = (e) => {
    setDonorType(e.target.value);
    // Reset type-specific fields when changing donor type
    setFormData((prev) => ({
      ...prev,
      idNumber: "",
      companyName: "",
      companyRegNumber: "",
      companyWebsite: "",
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return false;
    }

    if (donorType === "individual" && !formData.idNumber) {
      setError("ID/Passport number is required for individuals.");
      return false;
    }

    if (
      donorType === "company" &&
      (!formData.companyName || !formData.companyRegNumber)
    ) {
      setError(
        "Company name and registration number are required for companies."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Build data based on donor type
      const donorData = {
        donorType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        preferredDonationType: formData.preferredDonationType,
        createdAt: new Date(),
        verified: false,
      };

      if (donorType === "individual") {
        donorData.idNumber = formData.idNumber;
      } else if (donorType === "company") {
        donorData.companyName = formData.companyName;
        donorData.companyRegNumber = formData.companyRegNumber;
        donorData.companyWebsite = formData.companyWebsite;
      }

      // Save donor data in Firestore
      await setDoc(doc(db, "donors", user.uid), donorData);

      setSuccess("Donor registered successfully! Awaiting admin verification.");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
        country: "",
        preferredDonationType: "",
        idNumber: "",
        companyName: "",
        companyRegNumber: "",
        companyWebsite: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="signup-container">
      <h2 className="signup-title">Donor Sign Up</h2>
      {error && <p className="signup-error">{error}</p>}
      {success && <p className="signup-success">{success}</p>}

      <div className="donor-type-selector">
        <label>I am signing up as:</label>
        <div className="donor-type-options">
          <label className="donor-type-option">
            <input
              type="radio"
              value="individual"
              checked={donorType === "individual"}
              onChange={handleDonorTypeChange}
            />
            <span>Individual</span>
          </label>
          <label className="donor-type-option">
            <input
              type="radio"
              value="company"
              checked={donorType === "company"}
              onChange={handleDonorTypeChange}
            />
            <span>Company/Organization</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-section">
          <h3>Account Information</h3>
          <div className="form-row">
            <input
              type="text"
              name="fullName"
              placeholder={
                donorType === "individual" ? "Full Name" : "Contact Person Name"
              }
              value={formData.fullName}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>
          <div className="form-row">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>
          <input
            type="text"
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
            required
            className="signup-input full-width"
          />
        </div>

        <div className="form-section">
          <h3>Donation Preferences</h3>
          <select
            name="preferredDonationType"
            value={formData.preferredDonationType}
            onChange={handleChange}
            required
            className="signup-select full-width"
          >
            <option value="">What would you like to donate?</option>
            <option value="monetary">Monetary Donations</option>
            <option value="food">Food Items</option>
            <option value="clothes">Clothing</option>
            <option value="services">Services/Volunteering</option>
            <option value="other">Other Resources</option>
          </select>
        </div>

        {donorType === "individual" ? (
          <div className="form-section">
            <h3>Individual Information</h3>
            <input
              type="text"
              name="idNumber"
              placeholder="ID / Passport Number"
              value={formData.idNumber}
              onChange={handleChange}
              required
              className="signup-input full-width"
            />
          </div>
        ) : (
          <div className="form-section">
            <h3>Company Information</h3>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="signup-input full-width"
            />
            <div className="form-row">
              <input
                type="text"
                name="companyRegNumber"
                placeholder="Company Registration Number"
                value={formData.companyRegNumber}
                onChange={handleChange}
                required
                className="signup-input"
              />
              <input
                type="text"
                name="companyWebsite"
                placeholder="Company Website (optional)"
                value={formData.companyWebsite}
                onChange={handleChange}
                className="signup-input"
              />
            </div>
          </div>
        )}

        <button type="submit" className="signup-button">
          Create Account
        </button>
      </form>

      <section className="have-account">
        <p>
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onAlreadyHaveAccountClick();
            }}
            className="to-login"
          >
            Login
          </a>
        </p>
      </section>
    </section>
  );
};

export default DSignUp;
