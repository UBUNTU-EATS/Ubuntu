import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/signup.css";

const UnifiedSignup = ({ onAlreadyHaveAccountClick }) => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("individual");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    idNumber: "",
    companyName: "",
    companyRegNumber: "",
    companyWebsite: "",
    registrationNumber: "",
    contactPerson: "",
    website: "",
    beneficiaries: "",
    areasOfFocus: "",
    farmName: "",
    farmSize: "",
    cropType: "",
    maxFoodQuantity: "",
    vehicleType: "",
    availability: "",
    maxDistance: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (accountType === "individual" && !formData.idNumber) {
      setError("ID/Passport number is required for individuals.");
      return false;
    }
    if (
      accountType === "company" &&
      (!formData.companyName || !formData.companyRegNumber)
    ) {
      setError(
        "Company name and registration number are required for companies."
      );
      return false;
    }
    if (
      accountType === "ngo" &&
      (!formData.registrationNumber || !formData.contactPerson)
    ) {
      setError("Registration number and contact person are required for NGOs.");
      return false;
    }
    if (
      accountType === "farmer" &&
      (!formData.farmName || !formData.farmSize)
    ) {
      setError("Farm name and size are required for farmers.");
      return false;
    }
    if (
      accountType === "volunteer" &&
      (!formData.vehicleType || !formData.availability)
    ) {
      setError("Vehicle type and availability are required for volunteers.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Create userData object with only 'role'
      const userData = {
        role: accountType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        createdAt: serverTimestamp(),
        status: "pending", // for admin verification
      };

      // Add role-specific fields
      if (accountType === "individual") {
        userData.idNumber = formData.idNumber;
      } else if (accountType === "company") {
        userData.companyName = formData.companyName;
        userData.companyRegNumber = formData.companyRegNumber;
        userData.companyWebsite = formData.companyWebsite;
      } else if (accountType === "ngo") {
        userData.registrationNumber = formData.registrationNumber;
        userData.contactPerson = formData.contactPerson;
        userData.website = formData.website;
        userData.beneficiaries = formData.beneficiaries;
        userData.areasOfFocus = formData.areasOfFocus;
      } else if (accountType === "farmer") {
        userData.farmName = formData.farmName;
        userData.farmSize = formData.farmSize;
        userData.cropType = formData.cropType;
        userData.maxFoodQuantity = formData.maxFoodQuantity;
      } else if (accountType === "volunteer") {
        userData.vehicleType = formData.vehicleType;
        userData.availability = formData.availability;
        userData.maxDistance = formData.maxDistance;
        userData.completedDeliveries = 0;
      }

      await setDoc(doc(db, "users", formData.email), userData);

      setSuccess("Registered successfully! Awaiting admin verification.");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        idNumber: "",
        companyName: "",
        companyRegNumber: "",
        companyWebsite: "",
        registrationNumber: "",
        contactPerson: "",
        website: "",
        beneficiaries: "",
        areasOfFocus: "",
        farmName: "",
        farmSize: "",
        cropType: "",
        maxFoodQuantity: "",
        vehicleType: "",
        availability: "",
        maxDistance: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="signup-container">
      <h2 className="signup-title">Create Account</h2>
      {error && <p className="signup-error">{error}</p>}
      {success && <p className="signup-success">{success}</p>}

      <div className="account-type-selector">
        <label>Account Type</label>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="account-type-select"
        >
          <option value="individual">Individual</option>
          <option value="company">Company/Organization</option>
          <option value="ngo">NGO</option>
          <option value="farmer">Farmer</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </div>

      {/* The rest of the form remains the same */}
      {/* ... */}
      <form onSubmit={handleSubmit} className="signup-form">
        {/* Basic fields */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder={
                accountType === "individual" || accountType === "volunteer"
                  ? "Full Name"
                  : accountType === "company"
                  ? "Contact Person Name"
                  : "Organization Name"
              }
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
          <div className="form-row">
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
          </div>
        </div>

        {/* Individual Donor fields */}
        {accountType === "individual" && (
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
        )}

        {/* Company Donor fields */}
        {accountType === "company" && (
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

        {/* NGO fields */}
        {accountType === "ngo" && (
          <div className="form-section">
            <h3>NGO Information</h3>
            <input
              type="text"
              name="registrationNumber"
              placeholder="Registration Number"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
              className="signup-input"
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
              type="url"
              name="website"
              placeholder="Website"
              value={formData.website}
              onChange={handleChange}
              className="signup-input"
            />
            <input
              type="text"
              name="beneficiaries"
              placeholder="Beneficiaries Served"
              value={formData.beneficiaries}
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
          </div>
        )}

        {/* Farmer fields */}
        {accountType === "farmer" && (
          <div className="form-section">
            <h3>Farm Information</h3>
            <input
              type="text"
              name="farmName"
              placeholder="Farm Name"
              value={formData.farmName}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="text"
              name="farmSize"
              placeholder="Farm Size (e.g., 5 acres)"
              value={formData.farmSize}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="text"
              name="cropType"
              placeholder="Primary Crop Type"
              value={formData.cropType}
              onChange={handleChange}
              required
              className="signup-input"
            />
            <input
              type="number"
              name="maxFoodQuantity"
              placeholder="Max Food Quantity (kg)"
              value={formData.maxFoodQuantity}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>
        )}

        {/* Volunteer fields */}
        {accountType === "volunteer" && (
          <div className="form-section">
            <h3>Volunteer Information</h3>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="signup-select"
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

            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
              className="signup-select"
            >
              <option value="">-- Select Availability --</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
              <option value="Weekends and Evenings">
                Weekends and Evenings
              </option>
              <option value="Flexible">Flexible</option>
              <option value="On Call">On Call</option>
            </select>

            <select
              name="maxDistance"
              value={formData.maxDistance}
              onChange={handleChange}
              required
              className="signup-select"
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
          </div>
        )}

        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

<section className="have-account">
  <p>
    Already have an account?{" "}
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onAlreadyHaveAccountClick(); // triggers parent to switch form
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

export default UnifiedSignup;
