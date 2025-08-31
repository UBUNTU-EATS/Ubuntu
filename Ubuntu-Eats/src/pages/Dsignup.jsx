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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
        <label>Donor Type</label>
        <select value={donorType} onChange={handleDonorTypeChange} className="donor-type-select">
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
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
          className="signup-email"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="signup-password"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="signup-confirm-password"
        />
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
          name="address"
          placeholder="Address"
          value={formData.address}
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
        <select
          name="preferredDonationType"
          value={formData.preferredDonationType}
          onChange={handleChange}
          required
          className="signup-select"
        >
          <option value="">Preferred Donation Type</option>
          <option value="monetary">Monetary</option>
          <option value="food">Food</option>
          <option value="clothes">Clothes</option>
          <option value="services">Services</option>
          <option value="other">Other</option>
        </select>

        {/* Individual Fields */}
        {donorType === "individual" && (
          <input
            type="text"
            name="idNumber"
            placeholder="ID / Passport Number"
            value={formData.idNumber}
            onChange={handleChange}
            required
            className="signup-input"
          />
        )}

        {/* Company Fields */}
        {donorType === "company" && (
          <>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="signup-input"
            />
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
              placeholder="Company Website"
              value={formData.companyWebsite}
              onChange={handleChange}
              className="signup-input"
            />
          </>
        )}

        <button type="submit" className="signup-button">
          Sign Up
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