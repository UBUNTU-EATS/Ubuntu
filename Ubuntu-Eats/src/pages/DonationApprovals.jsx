import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import "../styles/DonationApprovals.css";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const DonationApproval = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING"); // default filter

  // 🔥 Fetch claims based on filter
  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const claimsRef = collection(db, "claims");
        let q;

        if (filter === "ALL") {
          q = claimsRef;
        } else {
          q = query(claimsRef, where("status", "==", filter));
        }

        const snapshot = await getDocs(q);
        const claimsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClaims(claimsList);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [filter]);

  // ✅ Approve Claim - FIXED to update both claim and listing status
  const handleApprove = async (claimId) => {
    try {
      // Get the claim data to find the associated listing
      const claims = await getDocs(collection(db, "claims"));
      const claim = claims.docs.find(doc => doc.id === claimId)?.data();
      
      if (!claim || !claim.listingId) {
        console.error("Claim or listing ID not found");
        alert("Error: Could not find associated listing");
        return;
      }

      // Update claim status
      const claimRef = doc(db, "claims", claimId);
      await updateDoc(claimRef, { status: "CLAIMED" });

      // IMPORTANT: Also update the listing status so farmer actions work
      const listingRef = doc(db, "foodListings", claim.listingId);
      await updateDoc(listingRef, { 
        listingStatus: "CLAIMED",
        updatedAt: new Date()
      });

      // Remove from local state since it's no longer pending
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));

      console.log(`Approved claim ${claimId} and updated listing ${claim.listingId} to CLAIMED status`);
    } catch (error) {
      console.error("Error approving claim:", error);
      alert("Failed to approve claim. Please try again.");
    }
  };

  // ✅ Reject Claim - Also resets listing status
  const handleReject = async (claimId) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this claim? This will make the food available to others."
    );
    if (!confirmReject) return;

    try {
      // Get the claim data to find the associated listing
      const claims = await getDocs(collection(db, "claims"));
      const claim = claims.docs.find(doc => doc.id === claimId)?.data();
      
      if (!claim || !claim.listingId) {
        console.error("Claim or listing ID not found");
        alert("Error: Could not find associated listing");
        return;
      }

      // Update claim status to rejected
      const claimRef = doc(db, "claims", claimId);
      await updateDoc(claimRef, { status: "REJECTED" });

      // Reset listing back to UNCLAIMED so others can claim it
      const listingRef = doc(db, "foodListings", claim.listingId);
      await updateDoc(listingRef, { 
        listingStatus: "UNCLAIMED",
        claimedBy: null,
        claimedByEmail: null,
        claimedAt: null,
        updatedAt: new Date()
      });

      // Remove from local state
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));

      console.log(`Rejected claim ${claimId} and reset listing ${claim.listingId} to UNCLAIMED status`);
    } catch (error) {
      console.error("Error rejecting claim:", error);
      alert("Failed to reject claim. Please try again.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="donation-approval">
      <div className="section-header">
        <h2>Donation Claims</h2>
        <p>Review and manage donation claims</p>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="claimFilter">Filter by Status:</label>
          <select
            id="claimFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Claims</option>
            <option value="PENDING">Pending</option>
            <option value="CLAIMED">Claimed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="results-count">
          {claims.length} claim{claims.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading claims...</div>
      ) : (
        <div className="claims-table-container">
          <table className="claims-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>User Type</th>
                <th>Listing ID</th>
                <th>Claim Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-claims">
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <h3>No claims found</h3>
                      <p>There are currently no claims matching the filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr className="claim-row" key={claim.id}>
                    <td>{claim.ngoName || claim.farmerName || "Unknown User"}</td>
                    <td>{claim.ngoEmail || claim.farmerEmail || "N/A"}</td>
                    <td>
                      <span className="user-type-badge">
                        {claim.ngoEmail ? "NGO" : claim.farmerEmail ? "Farmer" : "Unknown"}
                      </span>
                    </td>
                    <td>{claim.listingId || "N/A"}</td>
                    <td>{formatDate(claim.claimDate)}</td>
                    <td>
                      <span className={`status-badge ${claim.status.toLowerCase()}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {claim.status === "PENDING" && (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(claim.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(claim.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {claim.status === "CLAIMED" && (
                          <span className="status-text">✅ Approved</span>
                        )}
                        {claim.status === "REJECTED" && (
                          <span className="status-text">❌ Rejected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="info-section">
        <h3>ℹ️ How Claim Approval Works</h3>
        <div className="info-content">
          <div className="info-item">
            <strong>Approve:</strong> Updates both claim status and listing status to "CLAIMED", enabling farmer/NGO actions
          </div>
          <div className="info-item">
            <strong>Reject:</strong> Marks claim as rejected and resets listing to "UNCLAIMED" for others to claim
          </div>
          <div className="info-item">
            <strong>Important:</strong> Farmers and NGOs can only take actions (confirm pickup, cancel claim) when the listing status is "CLAIMED"
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationApproval;