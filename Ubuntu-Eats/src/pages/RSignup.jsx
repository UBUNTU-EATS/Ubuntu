import React, { useState } from "react";
import "../styles/signup.css";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RSignUp = ({ onAlreadyHaveAccountClick }) => {
  const [receiverType, setReceiverType] = useState("ngo"); // default NGO
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    country: "",

    // NGO fields
    registrationNumber: "",
    contactPerson: "",
    website: "",
    beneficiaries: "",
    areasOfFocus: "",

    // Farmer fields
    farmName: "",
    farmSize: "",
    cropType: "",
    maxFoodQuantity: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Shared fields
      let receiverData = {
        receiverType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        createdAt: new Date(),
        status: "pending",
      };

      // Add extra fields
      if (receiverType === "ngo") {
        receiverData = {
          ...receiverData,
          registrationNumber: formData.registrationNumber,
          contactPerson: formData.contactPerson,
          website: formData.website,
          beneficiaries: formData.beneficiaries,
          areasOfFocus: formData.areasOfFocus,
        };

        // Save NGO in "ngos" collection
        await setDoc(doc(db, "ngos", user.uid), receiverData);
      }

      if (receiverType === "farmer") {
        receiverData = {
          ...receiverData,
          farmName: formData.farmName,
          farmSize: formData.farmSize,
          cropType: formData.cropType,
          maxFoodQuantity: formData.maxFoodQuantity,
        };

        // Save Farmer in "farmers" collection
        await setDoc(doc(db, "farmers", user.uid), receiverData);
      }

      setSuccess("Registered successfully! Awaiting admin verification.");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        registrationNumber: "",
        contactPerson: "",
        website: "",
        beneficiaries: "",
        areasOfFocus: "",
        farmName: "",
        farmSize: "",
        cropType: "",
        maxFoodQuantity: "",
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

      <div className="donor-type-selector">
        <label>Receiver Type</label>
        <select
          value={receiverType}
          onChange={(e) => setReceiverType(e.target.value)}
          className="receiver-type-select"
        >
          <option value="ngo">NGO</option>
          <option value="farmer">Farmer</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        {/* shared fields */}
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

        {/* NGO-specific fields */}
        {receiverType === "ngo" && (
          <>
            <input
              type="text"
              name="registrationNumber"
              placeholder="Registration Number"
              value={formData.registrationNumber}
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
              type="url"
              name="website"
              placeholder="Website"
              value={formData.website}
              onChange={handleChange}
            />
            <input
              type="text"
              name="beneficiaries"
              placeholder="Beneficiaries Served"
              value={formData.beneficiaries}
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
          </>
        )}

        {/* Farmer-specific fields */}
        {receiverType === "farmer" && (
          <>
            <input
              type="text"
              name="farmName"
              placeholder="Farm Name"
              value={formData.farmName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="farmSize"
              placeholder="Farm Size (e.g., 5 acres)"
              value={formData.farmSize}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="cropType"
              placeholder="Primary Crop Type"
              value={formData.cropType}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="maxFoodQuantity"
              placeholder="Max Food Quantity (kg)"
              value={formData.maxFoodQuantity}
              onChange={handleChange}
              required
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

export default RSignUp;
