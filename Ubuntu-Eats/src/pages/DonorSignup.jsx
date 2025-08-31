import React, { useState } from "react";
import { auth, db } from "../firebase"; // make sure your firebase.js exports both auth & db
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const DonorSignup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organization: "",
    occupation: "",
    address: "",
    country: "",
    preferredDonationType: "",
    idNumber: "",
    verificationDocument: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
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

      // Save donor data in Firestore
      await setDoc(doc(db, "donors", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization,
        occupation: formData.occupation,
        address: formData.address,
        country: formData.country,
        preferredDonationType: formData.preferredDonationType,
        idNumber: formData.idNumber,
        createdAt: new Date(),
        verified: false, // admin will update after reviewing documents
      });

      setSuccess("Donor registered successfully! Awaiting admin verification.");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        organization: "",
        occupation: "",
        address: "",
        country: "",
        preferredDonationType: "",
        idNumber: "",
        verificationDocument: null,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Donor Sign Up</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="text"
          name="organization"
          placeholder="Organization / Company (if any)"
          value={formData.organization}
          onChange={handleChange}
          className="p-3 border rounded"
        />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation / Role"
          value={formData.occupation}
          onChange={handleChange}
          className="p-3 border rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Full Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <select
          name="preferredDonationType"
          value={formData.preferredDonationType}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        >
          <option value="">Select Preferred Donation Type</option>
          <option value="monetary">Monetary</option>
          <option value="food">Food</option>
          <option value="clothes">Clothes</option>
          <option value="services">Services</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          name="idNumber"
          placeholder="ID / Passport Number"
          value={formData.idNumber}
          onChange={handleChange}
          required
          className="p-3 border rounded"
        />
        <input
          type="file"
          name="verificationDocument"
          onChange={handleChange}
          className="p-3 border rounded col-span-2"
        />
        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default DonorSignup;
