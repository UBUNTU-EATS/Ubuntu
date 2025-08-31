import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/Auth.css";

const NGOSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orgName: "",
    regNumber: "",
    mission: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
    website: "",
    yearEstablished: "",
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

      // 2) Save NGO profile in Firestore
      await setDoc(doc(db, "ngos", user.uid), {
        orgName: formData.orgName,
        regNumber: formData.regNumber,
        mission: formData.mission,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        website: formData.website,
        yearEstablished: formData.yearEstablished,
        areasOfFocus: formData.areasOfFocus,
        status: "pending", // for admin to approve
        createdAt: serverTimestamp(),
      });

      alert("NGO registered successfully! Pending admin verification.");
      navigate("/ngo-login");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>NGO Registration</h2>
        <form onSubmit={handleSubmit}>
          <label>Organization Name</label>
          <input
            type="text"
            name="orgName"
            value={formData.orgName}
            onChange={handleChange}
            required
          />

          <label>Registration Number</label>
          <input
            type="text"
            name="regNumber"
            value={formData.regNumber}
            onChange={handleChange}
            required
          />

          <label>Mission Statement</label>
          <textarea
            name="mission"
            value={formData.mission}
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

          <label>Year Established</label>
          <input
            type="number"
            name="yearEstablished"
            value={formData.yearEstablished}
            onChange={handleChange}
          />

          <label>Areas of Focus</label>
          <input
            type="text"
            name="areasOfFocus"
            value={formData.areasOfFocus}
            onChange={handleChange}
          />

          <button type="submit" className="cta-btn">
            Register NGO
          </button>
        </form>
        <p>
          Already registered? <Link to="/ngo-login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default NGOSignup;
