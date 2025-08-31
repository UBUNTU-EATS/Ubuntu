import React, { useEffect, useState } from "react";
import RouteMap from './RouteMap'; // Import the RouteMap component
let fetchIssues;
let UpdateIssue; 
import '../styles/IssuePage.css';
let fetchUser
import { FaBars } from 'react-icons/fa';
import { toast } from "react-toastify";
import { useNavigate ,Navigate} from "react-router-dom";

// User's current location (farmer/collector location)
const userLocation = { lat: -26.2041, lng: 28.0473 }; // Central Johannesburg

const IssuesPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [editedIssue, setEditedIssue] = useState(null);
  const [reporter, setReporter] = useState(null); // State to hold reporter data
  const navigate = useNavigate();
  
    
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    navigate('/');
  };

  useEffect(() => {
    const loadIssues = async () => {
      setIsLoading(true);
      try {
        // Enhanced dummy issues with realistic Johannesburg locations
        const dummyIssues = [
          {
            listingID: "1",
            listingCompany: "KFC Brixton",
            listingStatus: "UNCLAIMED",
            priority: "high",
            dateListed: "20/08/2025",
            location: "Brixton",
            coordinates: { lat: -26.2550, lng: 27.9200 }, // Brixton, Johannesburg
            typeOfFood: "Cooked Meals",
            reportedAt: new Date().toISOString(),
          listingDescription: "50kg of cooked chicken pieces, wings and drumsticks. Best before today, safe for animal feed or compost. Available for immediate collection.",
            reporter: "farmer123",
            images: [
              "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
              "https://via.placeholder.com/200"
            ],
            feedback: "",
            address: "123 Main Road, Brixton, Johannesburg, 2092"
          },
          {
            listingID: "2",
            listingCompany: "Shoprite Auckland Park",
            listingStatus: "CLAIMED",
            priority: "medium",
            dateListed: "21/08/2025",
            location: "Auckland Park",
            coordinates: { lat: -26.1800, lng: 28.0030 }, 
            typeOfFood: "Fresh Produce",
            reportedAt: new Date().toISOString(),
            listingDescription: "Mixed vegetables including carrots, potatoes, and leafy greens. Slightly past sell-by date but perfect for animal feed or composting.",
            reporter: "farmer456",
            images: [
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80"
            ],
            address: "45 University Road, Auckland Park, Johannesburg, 2006"
          },
          {
            listingID: "3",
            listingCompany: "Woolworths Sandton",
            listingStatus: "UNCLAIMED",
            priority: "medium",
            dateListed: "22/08/2025",
            location: "Sandton",
            coordinates: { lat: -26.1070, lng: 28.0570 }, 
            typeOfFood: "Bakery Items",
            reportedAt: new Date().toISOString(),
          listingDescription: "Day-old bread, pastries, and baked goods. Perfect for animal feed or can be processed into animal feed supplements.",
            reporter: "baker789",
            images: [
              "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80"
            ],
            feedback: "",
            address: "Sandton City Mall, Sandton, Johannesburg, 2196"
          },
          {
            listingID: "4",
            listingCompany: "Pick n Pay Rosebank",
            listingStatus: "UNCLAIMED",
            priority: "high",
            dateListed: "23/08/2025",
            location: "Rosebank",
            coordinates: { lat: -26.1440, lng: 28.0410 }, 
            typeOfFood: "Dairy Products",
            reportedAt: new Date().toISOString(),
          listingDescription: "Expired yogurt and milk products. Can be used for animal feed processing or as fertilizer base after proper treatment.",
            reporter: "dairy_manager",
            images: [
              "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80"
            ],
            feedback: "",
            address: "The Zone Rosebank, 173 Oxford Rd, Rosebank, Johannesburg, 2196"
          },
          {
            listingID: "5",
            listingCompany: "Spar Melville",
            listingStatus: "CLAIMED",
            priority: "low",
            dateListed: "24/08/2025",
            location: "Melville",
            coordinates: { lat: -26.1890, lng: 28.0170 }, // Melville, Johannesburg
            typeOfFood: "Mixed Items",
            reportedAt: new Date().toISOString(),
          listingDescription: "Various expired canned goods, some damaged packaging but contents still good for animal consumption.",
            reporter: "store_manager",
            images: [],
            feedback: "Collector confirmed pickup for tomorrow morning.",
            address: "7th Street, Melville, Johannesburg, 2109"
          }
        ];

        setIssues(dummyIssues);
      } catch (error) {
        console.error("Failed to load issues:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadIssues();
  }, []);

  useEffect(() => {
    const selectIssue = async () => {
      if (selectedIssue) {
        setEditedIssue({ ...selectedIssue });
        // Mock fetching user data
        const mockReporter = selectedIssue.listingCompany;
        console.log("Reporter data:", mockReporter);
        setReporter(mockReporter);
      } else {
        setEditedIssue(null);
      }
    };

    selectIssue();
  }, [selectedIssue]);

  // Filter issues based on status
  const filteredIssues =
    statusFilter === "all"
      ? issues
      : issues.filter((listing) => listing.listingStatus === statusFilter);

  // Calculate pagination
  const totalPages = Math.ceil(filteredIssues.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedIssues = filteredIssues.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const handleIssueClick = (listing) => {
    setSelectedIssue(listing);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle changes to the edited listing
  const handleEditChange = (field, value) => {
    setEditedIssue((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submit the updated listing
  const handleUpdateIssue = async () => {
    if (!editedIssue) return;

    setIsLoading(true);
    try {
      // Mock API call
      // await UpdateIssue(editedIssue.listingID, editedIssue);

      // Update the issues array with the edited listing
      setIssues(
        issues.map((listing) =>
          listing.listingID === editedIssue.listingID ? editedIssue : listing
        )
      );

      // Update selected listing as well
      setSelectedIssue(null);

      // Show success message or notification here if needed
      toast.success("Updated Successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Failed to update listing:", error);
      alert("Failed to update listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteCalculated = (routeInfo) => {
    console.log('Route calculated for selected listing:', routeInfo);
  };

  return (
    <main className="issues-page">
      <header className="facility-header">
        <h1 className="facility-title">Available Food Listings</h1>
        <p className="facility-subtitle">
          Browse and claim available food donations near you.
        </p>
      </header>

      <section className="filter-controls">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          data-testid="status-filter"
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="UNCLAIMED">UNCLAIMED</option>
          <option value="CLAIMED">CLAIMED</option>
        </select>
      </section>

      <section className="issues-container">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Company/Individual</th>
              <th>Type of Food</th>
              <th>Status</th>
              <th>Collection Deadline</th>
              <th>Location</th>
              <th>Date Listed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <figure className="table-spinner"></figure>
                  <p>Loading...</p>
                </td>
              </tr>
            ) : (
              paginatedIssues.map((listing) => (
                <tr
                  key={listing.listingID}
                  onClick={() => handleIssueClick(listing)}
                  className={
                    selectedIssue?.listingID === listing.listingID
                      ? "selected-row"
                      : ""
                  }
                >
                  <td>{listing.listingCompany}</td>
                  <td>{listing.typeOfFood || "N/A"}</td>
                  <td>
                    <mark
                      className={`priority-badge ${
                        listing.listingStatus === "CLAIMED"
                          ? "priority-high"
                          : "priority-low"
                      }`}
                    >
                      {listing.listingStatus}
                    </mark>
                  </td>
                  <td>
                    <time dateTime={listing.reportedAt}>
                      {new Date(listing.reportedAt).toLocaleDateString()}
                    </time>
                  </td>
                  <td>{listing.location}</td>
                  <td>{listing.dateListed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="pagination-controls">
        <label>Rows per page: </label>
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="rows-select"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>

        <output className="page-info" data-testid="page-info">
          {startIndex + 1}–
          {Math.min(startIndex + rowsPerPage, filteredIssues.length)} of{" "}
          {filteredIssues.length}
        </output>

        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="pagination-btn"
          aria-label="Previous page"
        >
          &lt;
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="pagination-btn"
          aria-label="Next page"
        >
          &gt;
        </button>
      </footer>

      {selectedIssue && editedIssue && (
        <aside className="issue-details-modal" role="dialog">
          <article className="modal-content">
            <header className="modal-header">
              <h2>{selectedIssue.listingCompany}</h2>
              <button
                onClick={() => setSelectedIssue(null)}
                className="close-btn"
              >
                ×
              </button>
            </header>
            <section className="modal-body">
              <section className="details-grid">
                <article className="detail-item status-progress-container">
                  <h4>Status</h4>
                  <nav
                    className="status-progress-bar"
                    data-status={editedIssue.listingStatus}
                  >
                    {["UNCLAIMED", "CLAIMED"].map((status) => {
                      const isActive =
                        editedIssue.listingStatus === "CLAIMED" || editedIssue.listingStatus === status;

                      return (
                        <div
                          key={status}
                          className={`status-step ${isActive ? "active" : ""}`}
                        >
                          <i
                            className="step-circle"
                            style={{
                              backgroundColor: isActive
                                ? status === "CLAIMED"
                                  ? "red"
                                  : "green"
                                : "#fff",
                              borderColor: isActive
                                ? status === "CLAIMED"
                                  ? "red"
                                  : "green"
                                : "#e0ecf6",
                            }}
                          ></i>
                          <small className="step-label">{status}</small>
                        </div>
                      );
                    })}
                  </nav>
                </article>

                <article className="detail-item">
                  <h4>Location</h4>
                  <p>{editedIssue.location}</p>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    {editedIssue.address}
                  </small>
                </article>
                
                <article className="detail-item">
                  <h4>Reported By</h4>
                  <p>{selectedIssue.listingCompany || "Anonymous"}</p>
                </article>
                
                <article className="detail-item">
                  <h4>Reported At</h4>
                  <p>
                    <time dateTime={editedIssue.reportedAt}>
                      {new Date(editedIssue.reportedAt).toLocaleString()}
                    </time>
                  </p>
                </article>
              </section>

              <section className="description-section">
                <h4>Description</h4>
                <p>{editedIssue.listingDescription}</p>
              </section>

              {editedIssue.images && editedIssue.images.length > 0 && (
                <section className="images-section">
                  <h4>Images</h4>
                  <figure className="image-gallery">
                    {editedIssue.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Issue ${editedIssue.listingID} - Image ${index + 1}`}
                        className="listing-image"
                      />
                    ))}
                  </figure>
                </section>
              )}

              <section className="map-section">
                <h4>Route to Collection Point</h4>
                <div style={{ marginTop: '15px' }}>
                  <RouteMap
                    origin={userLocation}
                    destination={editedIssue.coordinates}
                    originLabel="Your Location"
                    destinationLabel={editedIssue.listingCompany}
                    originIcon="👤"
                    destinationIcon="🏪"
                    mapContainerStyle={{ width: "100%", height: "350px" }}
                    zoom={12}
                    showRouteInfo={true}
                    autoShowRoute={true}
                    onRouteCalculated={handleRouteCalculated}
                    className="issue-route-map"
                  />
                </div>
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <p><strong>Collection Address:</strong> {editedIssue.address}</p>
                  <p><strong>Food Type:</strong> {editedIssue.typeOfFood}</p>
                </div>
              </section>
            </section>
            
            <footer className="modal-footer">
              <button
                className={`facility-btn update-btn ${isLoading ? "loading" : ""}`}
                onClick={handleUpdateIssue}
                disabled={isLoading}
                style={{
                  backgroundColor: editedIssue.listingStatus === "UNCLAIMED" ? "#10B981" : "#6b7280",
                  cursor: editedIssue.listingStatus === "UNCLAIMED" ? "pointer" : "not-allowed"
                }}
              >
                {isLoading 
                  ? "Updating..." 
                  : editedIssue.listingStatus === "UNCLAIMED" 
                    ? "Claim Food" 
                    : "Already Claimed"
                }
              </button>
            </footer>
          </article>
        </aside>
      )}
    </main>
  );
};

export default IssuesPage;