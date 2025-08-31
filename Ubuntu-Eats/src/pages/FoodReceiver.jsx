import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  Package,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Home,
} from "lucide-react";

const FoodReceiverApp = () => {
  const [currentView, setCurrentView] = useState("register"); // register, dashboard
  const [userRole, setUserRole] = useState(""); // ngo, farmer
  const [userData, setUserData] = useState({});
  const [activeTab, setActiveTab] = useState("available");

  // Mock available donations data
  const [availableDonations, setAvailableDonations] = useState([
    {
      id: 1,
      donorName: "Green Valley Restaurant",
      foodType: "Fresh Sandwiches & Salads",
      category: "fresh-meals",
      quantity: "20 units",
      expiryDate: "2025-09-01",
      pickupDate: "2025-08-31",
      pickupTime: "14:00",
      location: "123 Main St, Johannesburg",
      distance: "2.3 km",
      description: "Assorted fresh sandwiches and garden salads",
      images: [
        {
          id: 1,
          url: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='%23f0f9ff'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%232563eb' font-size='30'%3E🥪%3C/text%3E%3C/svg%3E",
        },
      ],
      urgency: "high",
      contactPhone: "+27 11 123 4567",
      suitableFor: ["human", "livestock"],
    },
    {
      id: 2,
      donorName: "Fresh Fields Farm",
      foodType: "Slightly Overripe Vegetables",
      category: "fruits-vegetables",
      quantity: "50 kg",
      expiryDate: "2025-09-02",
      pickupDate: "2025-09-01",
      pickupTime: "10:00",
      location: "456 Farm Road, Midrand",
      distance: "12.7 km",
      description: "Mixed vegetables - perfect for livestock or composting",
      images: [
        {
          id: 2,
          url: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='%23f0fdf4'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%2316a34a' font-size='30'%3E🥬%3C/text%3E%3C/svg%3E",
        },
      ],
      urgency: "medium",
      contactPhone: "+27 11 987 6543",
      suitableFor: ["livestock", "fertilizer"],
    },
    {
      id: 3,
      donorName: "City Bakery",
      foodType: "Day-Old Bread & Pastries",
      category: "bakery",
      quantity: "15 trays",
      expiryDate: "2025-09-01",
      pickupDate: "2025-08-31",
      pickupTime: "18:00",
      location: "789 Baker St, Sandton",
      distance: "5.1 km",
      description: "Fresh baked goods from yesterday - still good quality",
      images: [
        {
          id: 3,
          url: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='%23fef3c7'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23d97706' font-size='30'%3E🥐%3C/text%3E%3C/svg%3E",
        },
      ],
      urgency: "high",
      contactPhone: "+27 11 555 0123",
      suitableFor: ["human"],
    },
  ]);

  const [claimedDonations, setClaimedDonations] = useState([]);
  const [collectedDonations, setCollectedDonations] = useState([]);

  // Registration Component
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      organizationType: "",
      organizationName: "",
      registrationNumber: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      capacity: "",
      servingAreas: "",
      documents: [],
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      setUserData(formData);
      setUserRole(formData.organizationType);
      setCurrentView("dashboard");
    };

    const handleFileUpload = (e) => {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        documents: [
          ...prev.documents,
          ...files.map((file) => ({ name: file.name, size: file.size })),
        ],
      }));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Food Receiver Registration
              </h1>
              <p className="text-gray-600 text-lg">
                Join our network to help reduce food waste
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Type Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.organizationType === "ngo"
                      ? "border-green-500 bg-green-50 shadow-lg"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      organizationType: "ngo",
                    }))
                  }
                >
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <h3 className="text-xl font-semibold mb-2">NGO/Charity</h3>
                    <p className="text-gray-600">
                      Distribute food to communities in need
                    </p>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.organizationType === "farmer"
                      ? "border-green-500 bg-green-50 shadow-lg"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      organizationType: "farmer",
                    }))
                  }
                >
                  <div className="text-center">
                    <Home className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <h3 className="text-xl font-semibold mb-2">
                      Farm/Agriculture
                    </h3>
                    <p className="text-gray-600">
                      Use food waste for livestock or composting
                    </p>
                  </div>
                </div>
              </div>

              {formData.organizationType && (
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h3 className="text-2xl font-semibold mb-4">
                    Organization Details
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.organizationName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            organizationName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Registration/License Number *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            registrationNumber: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.contactPerson}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactPerson: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {formData.organizationType === "ngo"
                          ? "Daily Capacity (meals)"
                          : "Farm Size (hectares)"}
                      </label>
                      <input
                        type="number"
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            capacity: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Full Address *
                    </label>
                    <textarea
                      required
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      {formData.organizationType === "ngo"
                        ? "Mission & Services"
                        : "Farm Operations Description"}
                    </label>
                    <textarea
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Verification Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="documents"
                      />
                      <label htmlFor="documents" className="cursor-pointer">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-gray-600">
                          Upload registration documents, certificates, etc.
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PDF, JPG, PNG (max 5MB each)
                        </p>
                      </label>
                    </div>
                    {formData.documents.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {formData.documents.map((doc, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            📄 {doc.name} ({(doc.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    Submit Registration for Verification
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Main Dashboard Component
  const Dashboard = () => {
    const handleClaimDonation = (donationId) => {
      const donation = availableDonations.find((d) => d.id === donationId);
      if (donation) {
        setClaimedDonations((prev) => [
          ...prev,
          {
            ...donation,
            status: "pending-admin-approval",
            claimedAt: new Date().toISOString(),
          },
        ]);
        setAvailableDonations((prev) =>
          prev.filter((d) => d.id !== donationId)
        );
      }
    };

    const handleCollectionChoice = (donationId, needsVolunteer) => {
      setClaimedDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? {
                ...d,
                status: needsVolunteer
                  ? "waiting-volunteer"
                  : "approved-self-collection",
                needsVolunteer,
              }
            : d
        )
      );
    };

    const handleConfirmCollection = (donationId) => {
      const donation = claimedDonations.find((d) => d.id === donationId);
      if (donation) {
        setCollectedDonations((prev) => [
          ...prev,
          {
            ...donation,
            status: "collected",
            collectedAt: new Date().toISOString(),
          },
        ]);
        setClaimedDonations((prev) => prev.filter((d) => d.id !== donationId));
      }
    };

    const getUrgencyColor = (urgency) => {
      switch (urgency) {
        case "high":
          return "text-red-600 bg-red-100";
        case "medium":
          return "text-orange-600 bg-orange-100";
        default:
          return "text-green-600 bg-green-100";
      }
    };

    const getSuitabilityIcon = (suitableFor) => {
      if (suitableFor.includes("human")) return "👥";
      if (suitableFor.includes("livestock")) return "🐄";
      return "🌱";
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 shadow-xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold">Food Receiver Dashboard</h1>
                <p className="text-green-100">
                  Welcome back, {userData.organizationName}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300">
                    {claimedDonations.length}
                  </div>
                  <div className="text-sm opacity-90">Claimed</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300">
                    {collectedDonations.length}
                  </div>
                  <div className="text-sm opacity-90">Collected</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300">
                    {availableDonations.length}
                  </div>
                  <div className="text-sm opacity-90">Available</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {["available", "claimed", "collected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold capitalize rounded-t-xl transition-all ${
                    activeTab === tab
                      ? "bg-green-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  {tab} Food
                  {tab === "available" && ` (${availableDonations.length})`}
                  {tab === "claimed" && ` (${claimedDonations.length})`}
                  {tab === "collected" && ` (${collectedDonations.length})`}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          {/* Available Food Tab */}
          {activeTab === "available" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Available Food Donations
              </h2>

              {availableDonations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No food available
                  </h3>
                  <p className="text-gray-500">
                    Check back soon for new donations
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {availableDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {donation.foodType}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {donation.donorName}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(
                                donation.urgency
                              )}`}
                            >
                              {donation.urgency.toUpperCase()} PRIORITY
                            </span>
                            <div
                              className="text-2xl"
                              title={`Suitable for: ${donation.suitableFor.join(
                                ", "
                              )}`}
                            >
                              {getSuitabilityIcon(donation.suitableFor)}
                            </div>
                          </div>
                        </div>

                        {donation.images && (
                          <div className="mb-4">
                            <img
                              src={donation.images[0].url}
                              alt="Food"
                              className="w-full h-32 object-cover rounded-xl"
                            />
                          </div>
                        )}

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              <strong>Quantity:</strong> {donation.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              <strong>Best Before:</strong>{" "}
                              {donation.expiryDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              <strong>Pickup:</strong> {donation.pickupDate} at{" "}
                              {donation.pickupTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              <strong>Location:</strong> {donation.location} (
                              {donation.distance})
                            </span>
                          </div>
                        </div>

                        {donation.description && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-700">
                              {donation.description}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => handleClaimDonation(donation.id)}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                          Claim This Donation
                        </button>

                        <div className="mt-3 flex justify-center">
                          <a
                            href={`tel:${donation.contactPhone}`}
                            className="flex items-center gap-2 text-green-600 hover:text-green-700"
                          >
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">Call Donor</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Claimed Food Tab */}
          {activeTab === "claimed" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Claimed Donations
              </h2>

              {claimedDonations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No claimed donations
                  </h3>
                  <p className="text-gray-500">
                    Claim food from the available tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claimedDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                      <div className="grid md:grid-cols-3 gap-6 items-center">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {donation.foodType}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            From: {donation.donorName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantity: {donation.quantity}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              Pickup: {donation.pickupDate} at{" "}
                              {donation.pickupTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{donation.location}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          {donation.status === "pending-admin-approval" && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 justify-end">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <span className="text-sm text-orange-600 font-semibold">
                                  Awaiting Admin Approval
                                </span>
                              </div>
                            </div>
                          )}

                          {donation.status === "admin-approved" && (
                            <div className="space-y-3">
                              <p className="text-sm text-green-600 font-semibold mb-3">
                                ✅ Approved! Choose collection method:
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleCollectionChoice(donation.id, false)
                                  }
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                                >
                                  Self Collect
                                </button>
                                <button
                                  onClick={() =>
                                    handleCollectionChoice(donation.id, true)
                                  }
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                                >
                                  Need Volunteer
                                </button>
                              </div>
                            </div>
                          )}

                          {donation.status === "approved-self-collection" && (
                            <div className="space-y-3">
                              <p className="text-sm text-blue-600 font-semibold">
                                Ready for self-collection
                              </p>
                              <button
                                onClick={() =>
                                  handleConfirmCollection(donation.id)
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                              >
                                Confirm Collected
                              </button>
                            </div>
                          )}

                          {donation.status === "waiting-volunteer" && (
                            <div className="space-y-2">
                              <p className="text-sm text-purple-600 font-semibold">
                                🚚 Volunteer Assigned
                              </p>
                              <p className="text-xs text-gray-600">
                                Waiting for delivery confirmation
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collected Food Tab */}
          {activeTab === "collected" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Collection History
              </h2>

              {collectedDonations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No collections yet
                  </h3>
                  <p className="text-gray-500">
                    Your collected donations will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collectedDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500"
                    >
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {donation.foodType}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From: {donation.donorName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Quantity: {donation.quantity}
                          </p>
                          <p className="text-sm text-gray-600">
                            Location: {donation.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Collected:{" "}
                            {new Date(
                              donation.collectedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600 font-semibold">
                              Successfully Collected
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {donation.needsVolunteer
                              ? "Delivered by volunteer"
                              : "Self-collected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  };

  // Simulate admin approval after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setClaimedDonations((prev) =>
        prev.map((d) =>
          d.status === "pending-admin-approval"
            ? { ...d, status: "admin-approved" }
            : d
        )
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [claimedDonations]);

  return (
    <div className="min-h-screen">
      {currentView === "register" ? <RegistrationForm /> : <Dashboard />}
    </div>
  );
};

export default FoodReceiverApp;
