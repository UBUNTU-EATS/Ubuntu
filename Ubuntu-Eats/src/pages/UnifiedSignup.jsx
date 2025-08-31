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
    // Common fields
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    country: "",

    // Individual donor fields
    idNumber: "",
    preferredDonationType: "",

    // Company donor fields
    companyName: "",
    companyRegNumber: "",
    companyWebsite: "",

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

    // Volunteer fields
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
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return false;
    }

    // Account type specific validations
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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Common data for all account types
      let userData = {
        accountType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        createdAt: serverTimestamp(),
        status: "pending", // For admin verification
      };

      // Add account type specific data
      switch (accountType) {
        case "individual":
          userData = {
            ...userData,
            idNumber: formData.idNumber,
            preferredDonationType: formData.preferredDonationType,
          };
          await setDoc(doc(db, "donors", user.uid), userData);
          break;

        case "company":
          userData = {
            ...userData,
            companyName: formData.companyName,
            companyRegNumber: formData.companyRegNumber,
            companyWebsite: formData.companyWebsite,
            preferredDonationType: formData.preferredDonationType,
          };
          await setDoc(doc(db, "donors", user.uid), userData);
          break;

        case "ngo":
          userData = {
            ...userData,
            registrationNumber: formData.registrationNumber,
            contactPerson: formData.contactPerson,
            website: formData.website,
            beneficiaries: formData.beneficiaries,
            areasOfFocus: formData.areasOfFocus,
          };
          await setDoc(doc(db, "ngos", user.uid), userData);
          break;

        case "farmer":
          userData = {
            ...userData,
            farmName: formData.farmName,
            farmSize: formData.farmSize,
            cropType: formData.cropType,
            maxFoodQuantity: formData.maxFoodQuantity,
          };
          await setDoc(doc(db, "farmers", user.uid), userData);
          break;

        case "volunteer":
          userData = {
            ...userData,
            vehicleType: formData.vehicleType,
            availability: formData.availability,
            maxDistance: formData.maxDistance,
            completedDeliveries: 0,
          };
          await setDoc(doc(db, "volunteers", user.uid), userData);
          break;

        default:
          throw new Error("Invalid account type");
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
        idNumber: "",
        preferredDonationType: "",
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
          <option value="individual">Individual Donor</option>
          <option value="company">Company/Organization Donor</option>
          <option value="ngo">NGO (Receiver)</option>
          <option value="farmer">Farmer (Receiver)</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        {/* Common fields for all account types */}
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

        {/* Individual Donor specific fields */}
        {(accountType === "individual" || accountType === "company") && (
          <div className="form-section">
            <h3>Donation Preferences</h3>
            <select
              name="preferredDonationType"
              value={formData.preferredDonationType}
              onChange={handleChange}
              required
              className="signup-select full-width"
            >
              <option value="">What would you like to donate?</option>
              <option value="monetary">Monetary Donations</option>
              <option value="food">Food Items</option>
              <option value="clothes">Clothing</option>
              <option value="services">Services/Volunteering</option>
              <option value="other">Other Resources</option>
            </select>
          </div>
        )}

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

        {/* Company Donor specific fields */}
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

        {/* NGO specific fields */}
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

        {/* Farmer specific fields */}
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

        {/* Volunteer specific fields */}
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

export default UnifiedSignup;
