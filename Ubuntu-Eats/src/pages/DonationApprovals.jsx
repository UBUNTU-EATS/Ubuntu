import React, { useState } from "react";
import "../styles/DonationApprovals.css";

const DonationApprovals = () => {
  const [approvalFilter, setApprovalFilter] = useState("pending");
  const [selectedApproval, setSelectedApproval] = useState(null);

  // Mock donation approval data
  const [approvals] = useState([
    {
      id: 1,
      donationId: 101,
      donorName: "Green Valley Restaurant",
      donorType: "restaurant",
      foodType: "Fresh Sandwiches",
      quantity: "20 units",
      recipientName: "Hope Community Center",
      recipientType: "ngo",
      claimDate: "2025-08-30 10:30",
      status: "pending",
      collectionMethod: "self",
      specialInstructions: "Ask for manager at back entrance",
    },
    {
      id: 2,
      donationId: 102,
      donorName: "Sunshine Bakery",
      donorType: "bakery",
      foodType: "Assorted Pastries",
      quantity: "15 kg",
      recipientName: "Children's Shelter",
      recipientType: "ngo",
      claimDate: "2025-08-30 11:45",
      status: "pending",
      collectionMethod: "volunteer",
      specialInstructions: "Pick up from side door after 4 PM",
    },
    {
      id: 3,
      donationId: 103,
      donorName: "Fresh Market",
      donorType: "grocery",
      foodType: "Mixed Vegetables",
      quantity: "30 kg",
      recipientName: "Elderly Care Home",
      recipientType: "ngo",
      claimDate: "2025-08-30 09:15",
      status: "pending",
      collectionMethod: "self",
      specialInstructions: "Available in crates near loading bay",
    },
    {
      id: 4,
      donationId: 104,
      donorName: "City Supermarket",
      donorType: "supermarket",
      foodType: "Expired Bread & Pastries",
      quantity: "35 kg",
      recipientName: "Green Fields Farm",
      recipientType: "farmer",
      claimDate: "2025-08-29 16:20",
      status: "approved",
      collectionMethod: "self",
      specialInstructions: "Available at loading dock, ask for John",
      approvedAt: "2025-08-29 16:45",
    },
    {
      id: 5,
      donationId: 105,
      donorName: "Daily Dairy",
      donorType: "dairy",
      foodType: "Expired Dairy Products",
      quantity: "45 kg",
      recipientName: "Green Fields Farm",
      recipientType: "farmer",
      claimDate: "2025-08-29 14:30",
      status: "rejected",
      collectionMethod: "volunteer",
      specialInstructions: "Refrigerated storage, ring bell for access",
      rejectedAt: "2025-08-29 15:00",
      rejectionReason: "Dairy products not suitable for livestock feed",
    },
  ]);

  const filteredApprovals = approvals.filter((approval) => {
    if (approvalFilter === "all") return true;
    return approval.status === approvalFilter;
  });

  const approveDonation = (approvalId) => {
    // In a real app, this would update the approval status in the database
    console.log(`Approving donation claim ${approvalId}`);
    setSelectedApproval(null);
  };

  const rejectDonation = (approvalId, reason) => {
    // In a real app, this would update the approval status in the database
    console.log(
      `Rejecting donation claim ${approvalId} with reason: ${reason}`
    );
    setSelectedApproval(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="status-badge pending">Pending Approval</span>;
      case "approved":
        return <span className="status-badge approved">Approved</span>;
      case "rejected":
        return <span className="status-badge rejected">Rejected</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getDonorTypeIcon = (type) => {
    switch (type) {
      case "restaurant":
        return "🍽️";
      case "bakery":
        return "🥐";
      case "grocery":
        return "🛒";
      case "supermarket":
        return "🏪";
      case "dairy":
        return "🥛";
      default:
        return "🏢";
    }
  };

  const getRecipientTypeIcon = (type) => {
    switch (type) {
      case "ngo":
        return "🤝";
      case "farmer":
        return "🚜";
      default:
        return "👥";
    }
  };

  const getCollectionMethodIcon = (method) => {
    switch (method) {
      case "self":
        return "🚗";
      case "volunteer":
        return "🤝";
      default:
        return "📦";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="donation-approvals">
      <div className="section-header">
        <h2>Donation Approvals</h2>
        <p>Review and approve donation claims from NGOs and farmers</p>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="approvalFilter">Filter by Status:</label>
          <select
            id="approvalFilter"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="all">All Claims</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="results-count">
          {filteredApprovals.length} claim
          {filteredApprovals.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Approvals Table */}
      <div className="approvals-table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th>Donation</th>
              <th>Donor</th>
              <th>Recipient</th>
              <th>Claim Date</th>
              <th>Collection</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-approvals">
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>No approval requests found</h3>
                    <p>No donation claims match the current filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApprovals.map((approval) => (
                <tr key={approval.id} className="approval-row">
                  <td>
                    <div className="donation-info">
                      <div className="food-type">{approval.foodType}</div>
                      <div className="food-quantity">{approval.quantity}</div>
                    </div>
                  </td>
                  <td>
                    <div className="donor-info">
                      <div className="donor-icon">
                        {getDonorTypeIcon(approval.donorType)}
                      </div>
                      <div className="donor-name">{approval.donorName}</div>
                    </div>
                  </td>
                  <td>
                    <div className="recipient-info">
                      <div className="recipient-icon">
                        {getRecipientTypeIcon(approval.recipientType)}
                      </div>
                      <div className="recipient-name">
                        {approval.recipientName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="claim-date">
                      {formatDate(approval.claimDate)}
                    </div>
                  </td>
                  <td>
                    <div className="collection-method">
                      <span className="method-icon">
                        {getCollectionMethodIcon(approval.collectionMethod)}
                      </span>
                      {approval.collectionMethod === "self"
                        ? "Self Collection"
                        : "Volunteer Assistance"}
                    </div>
                  </td>
                  <td>{getStatusBadge(approval.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => setSelectedApproval(approval)}
                      >
                        Review
                      </button>
                      {approval.status === "pending" && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => approveDonation(approval.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() =>
                              rejectDonation(approval.id, "Not suitable")
                            }
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

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedApproval(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Donation Claim Details</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedApproval(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="approval-detail-section">
                <h4>Donation Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Food Type:</span>
                    <span className="detail-value">
                      {selectedApproval.foodType}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">
                      {selectedApproval.quantity}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Claim Date:</span>
                    <span className="detail-value">
                      {formatDate(selectedApproval.claimDate)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Collection Method:</span>
                    <span className="detail-value">
                      {getCollectionMethodIcon(
                        selectedApproval.collectionMethod
                      )}
                      {selectedApproval.collectionMethod === "self"
                        ? " Self Collection"
                        : " Volunteer Assistance"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="approval-detail-section">
                <h4>Parties Involved</h4>
                <div className="parties-grid">
                  <div className="party-card">
                    <div className="party-header">
                      <span className="party-icon">
                        {getDonorTypeIcon(selectedApproval.donorType)}
                      </span>
                      <span className="party-type">Donor</span>
                    </div>
                    <div className="party-name">
                      {selectedApproval.donorName}
                    </div>
                    <div className="party-details">
                      {selectedApproval.donorType.charAt(0).toUpperCase() +
                        selectedApproval.donorType.slice(1)}
                    </div>
                  </div>

                  <div className="party-divider">
                    <div className="divider-arrow">→</div>
                  </div>

                  <div className="party-card">
                    <div className="party-header">
                      <span className="party-icon">
                        {getRecipientTypeIcon(selectedApproval.recipientType)}
                      </span>
                      <span className="party-type">Recipient</span>
                    </div>
                    <div className="party-name">
                      {selectedApproval.recipientName}
                    </div>
                    <div className="party-details">
                      {selectedApproval.recipientType.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedApproval.specialInstructions && (
                <div className="approval-detail-section">
                  <h4>Special Instructions</h4>
                  <div className="instructions-box">
                    <p>{selectedApproval.specialInstructions}</p>
                  </div>
                </div>
              )}

              {selectedApproval.status === "pending" && (
                <div className="modal-actions">
                  <button
                    className="modal-reject-btn"
                    onClick={() =>
                      rejectDonation(selectedApproval.id, "Not suitable")
                    }
                  >
                    Reject Claim
                  </button>
                  <button
                    className="modal-approve-btn"
                    onClick={() => approveDonation(selectedApproval.id)}
                  >
                    Approve Claim
                  </button>
                </div>
              )}

              {selectedApproval.status === "rejected" &&
                selectedApproval.rejectionReason && (
                  <div className="approval-detail-section">
                    <h4>Rejection Reason</h4>
                    <div className="rejection-reason">
                      <p>{selectedApproval.rejectionReason}</p>
                      <div className="rejection-date">
                        Rejected on {formatDate(selectedApproval.rejectedAt)}
                      </div>
                    </div>
                  </div>
                )}

              {selectedApproval.status === "approved" &&
                selectedApproval.approvedAt && (
                  <div className="approval-detail-section">
                    <h4>Approval Information</h4>
                    <div className="approval-info">
                      <div className="approved-badge">
                        <span className="approved-icon">✅</span>
                        <span>Approved by Admin</span>
                      </div>
                      <div className="approval-date">
                        Approved on {formatDate(selectedApproval.approvedAt)}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationApprovals;
