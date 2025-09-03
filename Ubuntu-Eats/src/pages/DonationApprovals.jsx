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

  // ✅ Approve Claim
  const handleApprove = async (claimId) => {
    try {
      const claimRef = doc(db, "claims", claimId);
      await updateDoc(claimRef, { status: "CLAIMED" });
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
    } catch (error) {
      console.error("Error approving claim:", error);
    }
  };

  // ✅ Reject Claim
  const handleReject = async (claimId) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this claim?"
    );
    if (!confirmReject) return;

    try {
      const claimRef = doc(db, "claims", claimId);
      await updateDoc(claimRef, { status: "REJECTED" });
      setClaims((prev) => prev.filter((claim) => claim.id !== claimId));
    } catch (error) {
      console.error("Error rejecting claim:", error);
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
                <th>NGO Name</th>
                <th>Email</th>
                <th>Listing ID</th>
                <th>Claim Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-claims">
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
                    <td>{claim.ngoName || "Unknown NGO"}</td>
                    <td>{claim.ngoEmail || "N/A"}</td>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonationApproval;
