import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "../styles/Auth.css";

const DonorSignup = () => {
  const [donorType, setDonorType] = useState("individual"); // default to individual
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
    <div className="auth-container">
      <div className="auth-card">
        <h2>Donor Sign Up</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <label>Donor Type</label>
        <select value={donorType} onChange={handleDonorTypeChange}>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
          />
          <select
            name="preferredDonationType"
            value={formData.preferredDonationType}
            onChange={handleChange}
            required
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
              />
              <input
                type="text"
                name="companyRegNumber"
                placeholder="Company Registration Number"
                value={formData.companyRegNumber}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="companyWebsite"
                placeholder="Company Website"
                value={formData.companyWebsite}
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit" className="cta-btn">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorSignup;
