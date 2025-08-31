import React, { useState } from "react";
import "../styles/DonorForm.css";

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
    contactPerson: donorData.name,
    contactPhone: donorData.phone,
    pickupAddress: donorData.address,
  });

  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              url: e.target.result,
              name: file.name,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const donation = {
      ...formData,
      images: images,
      submittedAt: new Date().toISOString(),
      scheduledTime: `${formData.pickupDate} ${formData.pickupTime}`,
      location: formData.pickupAddress,
    };
    onSubmit(donation);

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
      contactPerson: donorData.name,
      contactPhone: donorData.phone,
      pickupAddress: donorData.address,
    });
    setImages([]);
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="donation-form-container">
      <div className="form-header">
        <h2>Donate Food</h2>
        <p>Help us redistribute your surplus food to those in need</p>
      </div>

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
                <option value="fresh-meals">Fresh Meals</option>
                <option value="bakery">Bakery Items</option>
                <option value="fruits-vegetables">Fruits & Vegetables</option>
                <option value="dairy">Dairy Products</option>
                <option value="packaged-goods">Packaged Goods</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other</option>
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
                <option value="portions">Portions</option>
                <option value="boxes">Boxes</option>
                <option value="trays">Trays</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the food condition, ingredients, preparation method, etc."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate">Best Before Date *</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={today}
                required
              />
            </div>
          </div>
        </div>

        {/* Food Images */}
        <div className="form-section">
          <h3>Food Images</h3>
          <div
            className={`image-upload-area ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="images" className="upload-label">
              <div className="upload-icon">📷</div>
              <p>Click to upload or drag and drop images</p>
              <small>PNG, JPG, JPEG up to 5MB each</small>
            </label>
          </div>

          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((image) => (
                <div key={image.id} className="image-preview">
                  <img src={image.url} alt={image.name} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(image.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pickup Schedule */}
        <div className="form-section">
          <h3>Pickup Schedule</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pickupDate">Pickup Date *</label>
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
              <label htmlFor="pickupTime">Preferred Time *</label>
              <select
                id="pickupTime"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Time</option>
                <option value="08:00">8:00 AM</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="19:00">7:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="form-section">
          <h3>Contact & Location Details</h3>
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
          <button type="submit" className="submit-btn">
            Submit Donation
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;
