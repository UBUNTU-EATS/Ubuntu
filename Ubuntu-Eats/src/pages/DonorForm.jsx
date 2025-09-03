import React, { useState } from "react";
import "../styles/DonorForm.css";
import { auth, db } from "../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

const DonationForm = ({ onSubmit, donorData }) => {
  const [formData, setFormData] = useState({
    foodType: "",
    category: "",
    quantity: "",
    unit: "units",
    description: "",
    expiryDate: "",
    pickupDate: "",
    pickupTime: "",
    specialInstructions: "",
    contactPerson: donorData?.name || donorData?.companyName || "",
    contactPhone: donorData?.phone || "",
    pickupAddress: donorData?.address || "",
    forFarmers: false,
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const processFiles = (files) => {
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setSubmitStatus({
          type: 'error',
          message: `${file.name} is not a valid image format. Please use JPG or PNG.`
        });
        return;
      }

      if (file.size > maxSize) {
        setSubmitStatus({
          type: 'error',
          message: `${file.name} is too large. Maximum size is 5MB.`
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            url: e.target.result,
            name: file.name,
            file: file
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      if (!auth.currentUser) throw new Error("User not authenticated");

      const donationData = {
        ...formData,
        status: "unclaimed",
        donorEmail: auth.currentUser.email,
        submittedAt: new Date().toISOString(),
      };

      // Add donation to Firestore "Donation" collection
      const docRef = await addDoc(collection(db, "Donation"), donationData);
      console.log("Donation added with ID:", docRef.id);

      // Success callback
      onSubmit({
        ...donationData,
        id: docRef.id
      });

      setSubmitStatus({
        type: 'success',
        message: 'Donation submitted successfully! It will appear in available listings shortly.'
      });

      // Reset form
      setFormData({
        foodType: "",
        category: "",
        quantity: "",
        unit: "units",
        description: "",
        expiryDate: "",
        pickupDate: "",
        pickupTime: "",
        specialInstructions: "",
        contactPerson: donorData?.name || donorData?.companyName || "",
        contactPhone: donorData?.phone || "",
        pickupAddress: donorData?.address || "",
        forFarmers: false,
      });
      setImages([]);

    } catch (error) {
      console.error("Error submitting donation:", error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit donation. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="donation-form-container">
      <div className="form-header">
        <h2>Donate Food</h2>
        <p>Help us redistribute your surplus food to those in need</p>
      </div>

      {submitStatus.message && (
        <div className={`status-message ${submitStatus.type}`} style={{
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          backgroundColor: submitStatus.type === 'success' ? '#d4edda' : '#f8d7da',
          color: submitStatus.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${submitStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="donation-form">
        {/* Food Details */}
        <div className="form-section">
          <h3>Food Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="foodType">Food Type *</label>
              <input
                type="text"
                id="foodType"
                name="foodType"
                value={formData.foodType}
                onChange={handleInputChange}
                placeholder="e.g., Fresh Sandwiches, Baked Goods"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Fresh Meals">Fresh Meals</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Baked Goods">Baked Goods</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
              >
                <option value="units">Units</option>
                <option value="kg">Kilograms</option>
                <option value="lbs">Pounds</option>
                <option value="servings">Servings</option>
                <option value="boxes">Boxes</option>
                <option value="bags">Bags</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the food items, preparation details, ingredients, etc."
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Expiry & Pickup */}
        <div className="form-section">
          <h3>Expiry & Pickup Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={today}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pickupDate">Preferred Pickup Date *</label>
              <input
                type="date"
                id="pickupDate"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleInputChange}
                min={today}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pickupTime">Preferred Pickup Time *</label>
              <input
                type="time"
                id="pickupTime"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="forFarmers"
                  checked={formData.forFarmers}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Available for Farmers/Animal Feed
              </label>
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                Check this if the food can be used for animal consumption
              </small>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="contactPerson">Contact Person *</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactPhone">Contact Phone *</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="pickupAddress">Pickup Address *</label>
              <textarea
                id="pickupAddress"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="specialInstructions">Special Instructions</label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                placeholder="Any special handling instructions, access codes, parking info, etc."
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
            style={{
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Donation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;
