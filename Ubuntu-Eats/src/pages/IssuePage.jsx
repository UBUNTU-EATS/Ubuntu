import React, { useEffect, useState } from "react";
import RouteMap from './RouteMap'; // Import the RouteMap component
let fetchIssues;
let UpdateIssue; 
import '../styles/IssuePage.css';
let fetchUser
import { FaBars } from 'react-icons/fa';
import { toast } from "react-toastify";
import { useNavigate ,Navigate} from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // your firebase.js


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
    
      const colRef = collection(db, "foodListings");
  
      const snapshot = await getDocs(colRef);

    
      const listings = snapshot.docs
  .map(doc => {
    const data = doc.data();
    return {
      listingID: data.listingID,
      listingCompany: data.listingCompany,
      listingStatus: data.listingStatus,
      typeOfFood: data.typeOfFood,
      collectBy: data.collectBy?.toDate().toLocaleString(),
      dateListed: data.dateListed?.toDate().toLocaleDateString(),
      location: data.location,
      coordinates: data.coordinates
        ? { lat: data.coordinates.latitude * -1, lng: data.coordinates.longitude }
        : null,
      listingDescription: data.listingDescription,
      address: data.address,
      forFarmers: data.forFarmers,
    };
  })
  .filter(listing => listing.forFarmers); // keep only the ones with forFarmers === true


      setIssues(listings);
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
                    <time dateTime={listing.collectBy}>
                      {listing.collectBy}
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
                  <h4>Listed on</h4>
                  <p>
                    <time dateTime={editedIssue.dateListed}>
                      {(editedIssue.dateListed)}
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