import React, { useState } from "react";
import "../styles/Auth.css";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RSignUp = ({ onAlreadyHaveAccountClick }) => {
  const [receiverType, setReceiverType] = useState("individual"); // default to individual
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    organization: "",
    contactPerson: "",
    website: "",
    maxFoodQuantity: "",
    areasOfFocus: "",
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

  const handleReceiverTypeChange = (e) => {
    setReceiverType(e.target.value);
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

      // Build receiver data
      const receiverData = {
        receiverType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        contactPerson: formData.contactPerson,
        maxFoodQuantity: formData.maxFoodQuantity,
        areasOfFocus: formData.areasOfFocus,
        createdAt: new Date(),
        status: "pending", // awaiting admin verification
      };

      // Add optional fields based on receiver type
      if (formData.organization) {
        receiverData.organization = formData.organization;
      }
      if (formData.website) {
        receiverData.website = formData.website;
      }

      // Save receiver data in Firestore
      await setDoc(doc(db, "receivers", user.uid), receiverData);

      setSuccess("Receiver registered successfully! Awaiting admin verification.");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        organization: "",
        contactPerson: "",
        website: "",
        maxFoodQuantity: "",
        areasOfFocus: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Receiver Sign Up</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <label>Receiver Type</label>
        <select value={receiverType} onChange={handleReceiverTypeChange}>
          <option value="individual">Individual</option>
          <option value="ngo">NGO</option>
          <option value="farmer">Farmer</option>
        </select>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name / Organization"
            value={formData.name}
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
            name="contactPerson"
            placeholder="Contact Person"
            value={formData.contactPerson}
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
            name="city"
            placeholder="City"
            value={formData.city}
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
          <input
            type="text"
            name="organization"
            placeholder="Organization (Optional)"
            value={formData.organization}
            onChange={handleChange}
          />
          <input
            type="url"
            name="website"
            placeholder="Website (Optional)"
            value={formData.website}
            onChange={handleChange}
          />
          <input
            type="number"
            name="maxFoodQuantity"
            placeholder="Maximum Food Quantity (kg)"
            value={formData.maxFoodQuantity}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="areasOfFocus"
            placeholder="Areas of Focus"
            value={formData.areasOfFocus}
            onChange={handleChange}
            required
          />

          <button type="submit" className="cta-btn">
            Sign Up
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onAlreadyHaveAccountClick();
            }}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default RSignUp;