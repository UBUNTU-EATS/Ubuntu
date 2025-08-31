import React, { useState } from "react";
import "../styles/signup.css";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RSignUp = ({ onAlreadyHaveAccountClick }) => {
  const [receiverType, setReceiverType] = useState("individual"); 
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

      // Add optional fields
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
    <section className="signup-container">
      <h2 className="signup-title">Receiver Sign Up</h2>
      {error && <p className="signup-error">{error}</p>}
      {success && <p className="signup-success">{success}</p>}

      <div className="receiver-type-selector">
        <label>Receiver Type</label>
        <select value={receiverType} onChange={handleReceiverTypeChange} className="receiver-type-select">
          <option value="individual">Individual</option>
          <option value="ngo">NGO</option>
          <option value="farmer">Farmer</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          name="name"
          placeholder="Name / Organization"
          value={formData.name}
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
          name="contactPerson"
          placeholder="Contact Person"
          value={formData.contactPerson}
          onChange={handleChange}
          required
          className="signup-input"
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
          name="city"
          placeholder="City"
          value={formData.city}
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
        <input
          type="text"
          name="organization"
          placeholder="Organization (Optional)"
          value={formData.organization}
          onChange={handleChange}
          className="signup-input"
        />
        <input
          type="url"
          name="website"
          placeholder="Website (Optional)"
          value={formData.website}
          onChange={handleChange}
          className="signup-input"
        />
        <input
          type="number"
          name="maxFoodQuantity"
          placeholder="Maximum Food Quantity (kg)"
          value={formData.maxFoodQuantity}
          onChange={handleChange}
          required
          className="signup-input"
        />
        <input
          type="text"
          name="areasOfFocus"
          placeholder="Areas of Focus"
          value={formData.areasOfFocus}
          onChange={handleChange}
          required
          className="signup-input"
        />

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

export default RSignUp;