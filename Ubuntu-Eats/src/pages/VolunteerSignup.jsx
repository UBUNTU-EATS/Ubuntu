import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/Auth.css";

const VolunteerSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    vehicleType: "",
    availability: "",
    maxDistance: "",
    address: "",
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

      // 2) Save Volunteer profile in Firestore
      await setDoc(doc(db, "volunteers", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        availability: formData.availability,
        maxDistance: formData.maxDistance,
        address: formData.address,
        status: "pending", // for admin verification
        completedDeliveries: 0,
        createdAt: serverTimestamp(),
      });

      alert("Volunteer registered successfully! Pending admin verification.");
      navigate("/volunteer-login");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Volunteer Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
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

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Vehicle Type</label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Vehicle --</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Bicycle">Bicycle</option>
            <option value="Other">Other</option>
          </select>

          <label>Availability</label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Availability --</option>
            <option value="Weekdays">Weekdays</option>
            <option value="Weekends">Weekends</option>
            <option value="Weekends and Evenings">Weekends and Evenings</option>
            <option value="Flexible">Flexible</option>
            <option value="On Call">On Call</option>
          </select>

          <label>Maximum Distance</label>
          <select
            name="maxDistance"
            value={formData.maxDistance}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Distance --</option>
            <option value="10 km">10 km</option>
            <option value="15 km">15 km</option>
            <option value="20 km">20 km</option>
            <option value="25 km">25 km</option>
            <option value="30 km">30 km</option>
            <option value="50 km">50 km</option>
            <option value="No limit">No limit</option>
          </select>

          <label>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            required
          />

          <button type="submit" className="cta-btn">
            Register Volunteer
          </button>
        </form>
        <p>
          Already registered? <Link to="/volunteer-login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default VolunteerSignup;
