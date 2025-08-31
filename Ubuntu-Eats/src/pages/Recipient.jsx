import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/Auth.css";

const ReceiverSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    receiverType: "individual", // default
    name: "",
    organization: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
    website: "",
    maxFoodQuantity: "", // quantity they can handle
    areasOfFocus: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // 1) Create Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2) Save Receiver profile in Firestore
      await setDoc(doc(db, "receivers", user.uid), {
        receiverType: formData.receiverType,
        name: formData.name,
        organization: formData.organization,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        website: formData.website,
        maxFoodQuantity: formData.maxFoodQuantity,
        areasOfFocus: formData.areasOfFocus,
        status: "pending", // admin verification
        createdAt: serverTimestamp(),
      });

      alert("Receiver registered successfully! Pending admin verification.");
      navigate("/receiver-login");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Receiver Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <label>Receiver Type</label>
          <select
            name="receiverType"
            value={formData.receiverType}
            onChange={handleChange}
          >
            <option value="individual">Individual</option>
            <option value="ngo">NGO</option>
            <option value="farmer">Farmer</option>
          </select>

          <label>Name / Organization</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Contact Person</label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            required
          />

          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />

          <label>City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />

          <label>Country</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />

          <label>Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
          />

          <label>Maximum Food Quantity (kg)</label>
          <input
            type="number"
            name="maxFoodQuantity"
            value={formData.maxFoodQuantity}
            onChange={handleChange}
            required
          />

          <label>Areas of Focus</label>
          <input
            type="text"
            name="areasOfFocus"
            value={formData.areasOfFocus}
            onChange={handleChange}
          />

          <button type="submit" className="cta-btn">
            Register Receiver
          </button>
        </form>
        <p>
          Already registered? <Link to="/receiver-login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default ReceiverSignup;
