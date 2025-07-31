import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import { Table, Spinner, Alert } from "react-bootstrap";

const FeedbackManagePage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get("http://localhost:9999/api/receptionist/feedback", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedbacks(res.data);
      } catch (err) {
        setError("Không thể tải feedback.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [token]);

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-primary fw-bold mb-4">Quản Lý Feedback</h3>
      {feedbacks.length === 0 ? (
        <p>Không có feedback nào.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>User</th>
              <th>Nội dung</th>
              <th>Đánh giá</th>
              <th>Ngày gửi</th>
              <th>Lịch hẹn</th>
              <th>Bác sĩ</th> {/* Column mới */}
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb) => (
              <tr key={fb._id}>
                <td>{fb.userId?.name || "(Không rõ)"}</td>
                <td>{fb.content}</td>
                <td>{fb.rating} sao</td>
                <td>{new Date(fb.createdAt).toLocaleString()}</td>
                <td>{fb.appointmentId ? new Date(fb.appointmentId.appointmentDate).toLocaleDateString() : "-"}</td>
                <td>{fb.appointmentId?.doctorId?.name || "-"}</td> {/* Hiển thị tên bác sĩ */}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default FeedbackManagePage;