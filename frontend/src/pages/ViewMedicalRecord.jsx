import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, Typography, Pagination
} from "@mui/material";
import "../assets/css/ViewMedicalRecord.css";

const ViewMedicalRecord = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRaw = localStorage.getItem("user");

        if (!token || !userRaw) {
          throw new Error("Please log in to view medical records.");
        }

        const user = JSON.parse(userRaw);
        if (!user._id) throw new Error("User information not found.");

        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(
          `http://localhost:9999/api/staff/medicalrecord/${user._id}`,
          { headers }
        );

        if (!res.data.success) {
          throw new Error(res.data.message || "Unable to load profiles.");
        }

        setProfiles(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load profiles.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit", month: "2-digit", year: "numeric"
        })
      : "Not available";
  };

  const formatCurrency = (amount) => {
    return amount
      ? amount.toLocaleString("en-US", { style: "currency", currency: "VND" })
      : "Not available";
  };

  const handleViewDetail = (profile) => {
    setSelectedProfile(profile);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProfile(null);
  };

  const paginatedProfiles = profiles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="profile-page min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Your Medical Records</h2>

      {loading && <p className="text-center text-gray-600">Loading...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No medical records found for your account.
        </div>
      )}

      {!loading && !error && profiles.length > 0 && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Profile Name</strong></TableCell>
                  <TableCell><strong>Date of Birth</strong></TableCell>
                  <TableCell><strong>Gender</strong></TableCell>
                  <TableCell><strong>Medical Record</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProfiles.map((profile) => (
                  <TableRow key={profile._id}>
                    <TableCell>{profile.name || "Not available"}</TableCell>
                    <TableCell>{formatDate(profile.dateOfBirth)}</TableCell>
                    <TableCell>{profile.gender || "Not available"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetail(profile)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            count={Math.ceil(profiles.length / rowsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{ mt: 2, display: "flex", justifyContent: "center" }}
          />

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Profile Details</DialogTitle>
            <DialogContent dividers>
              {selectedProfile && (
                <div className="dialog-content">
                  <div className="section profile-info">
                    <Typography><strong>Profile Information</strong></Typography>
                    <Typography><strong>Username:</strong> {selectedProfile.userName || "Not available"}</Typography>
                    <Typography><strong>User Code:</strong> {selectedProfile.userCode || "Not available"}</Typography>
                    <Typography><strong>Profile Name:</strong> {selectedProfile.name}</Typography>
                    <Typography><strong>Date of Birth:</strong> {formatDate(selectedProfile.dateOfBirth)}</Typography>
                    <Typography><strong>Gender:</strong> {selectedProfile.gender}</Typography>
                    <Typography><strong>Diagnosis:</strong> {selectedProfile.diagnose || "Not available"}</Typography>
                    <Typography><strong>Notes:</strong> {selectedProfile.note || "Not available"}</Typography>
                    <Typography><strong>Issues:</strong> {selectedProfile.issues || "Not available"}</Typography>
                    <Typography><strong>Created At:</strong> {formatDate(selectedProfile.createdAt)}</Typography>
                    <Typography><strong>Updated At:</strong> {formatDate(selectedProfile.updatedAt)}</Typography>
                  </div>
                  <div className="section doctor-info">
                    <Typography><strong>Doctor Information</strong></Typography>
                    <Typography>Name: {selectedProfile.doctor?.name || "Not available"}</Typography>
                    <Typography>Email: {selectedProfile.doctor?.email || "Not available"}</Typography>
                    <Typography>Role: {selectedProfile.doctor?.role || "Not available"}</Typography>
                  </div>
                  <div className="section medicine-info">
                    <Typography><strong>Medicine Information</strong></Typography>
                    <Typography>Medicine Name: {selectedProfile.medicine?.name || "Not available"}</Typography>
                    <Typography>Medicine Type: {selectedProfile.medicine?.type || "Not available"}</Typography>
                    <Typography>Price: {formatCurrency(selectedProfile.medicine?.unitPrice)}</Typography>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ViewMedicalRecord;