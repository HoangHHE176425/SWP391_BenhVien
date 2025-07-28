import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { Table, Button, Spinner, Alert, Form, Modal } from "react-bootstrap";

const AppointmentManagePage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("booked"); // "all" | "booked"
  const { token } = useAuth();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ content: "", rating: 5 });

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/user/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Xử lý trường hợp API trả object, không phải mảng
      const data = res.data;

      const appointmentsData = Array.isArray(data)
        ? data
        : data.appointments || data.user?.appointments || [];

      if (!Array.isArray(appointmentsData)) {
        console.error("API không trả về mảng appointments:", data);
        setError("Dữ liệu lịch hẹn không hợp lệ.");
        setAppointments([]);
      } else {
        setAppointments(appointmentsData);
      }

    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setError("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      const res = await axios.post(
        `http://localhost:9999/api/user/cancel/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(res.data.message); // Hiển thị message từ server (thành công hoặc lỗi)
      fetchAppointments(); // Reload danh sách từ server
    } catch (err) {
      console.error("Cancel failed", err);
      const errorMessage = err.response?.data?.message || "Hủy lịch hẹn thất bại. Vui lòng thử lại.";
      alert(errorMessage); // Hiển thị lỗi cụ thể
    }
  };

  const openFeedbackModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = async () => {
    try {
      await axios.post(
        "http://localhost:9999/api/user/createFeedback",
        {
          content: feedbackData.content,
          rating: feedbackData.rating,
          appointmentId: selectedAppointmentId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowFeedbackModal(false);
      alert("Gửi phản hồi thành công!");
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Gửi phản hồi thất bại.");
    }
  };

  const filteredAppointments =
    filterStatus === "booked"
      ? appointments.filter((a) => a.status === "Booked")
      : appointments;

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="p-4 bg-white rounded shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-primary fw-bold">Lịch hẹn của bạn</h3>
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="all">Tất cả lịch hẹn</option>
            <option value="booked">Lịch đang đặt</option>
          </Form.Select>
        </div>

        {filteredAppointments.length === 0 ? (
          <p>Không có lịch hẹn nào phù hợp.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt._id}>
                  <td>{appt.doctorId?.name || "(Không rõ)"}</td>
                  <td>{appt.department?.name || "(Không rõ)"}</td>
                  <td>{new Date(appt.appointmentDate).toLocaleString()}</td>
                  <td>{appt.type}</td>
                  <td>{appt.status}</td>
                  <td>
                    {appt.status === "Booked" ? (
                      <Button variant="danger" size="sm" onClick={() => handleCancel(appt._id)}>Hủy</Button>
                    ) : appt.status === "PendingCancel" ? (
                      <span>Chờ duyệt</span>
                    ) : appt.status === "Completed" ? (
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => openFeedbackModal(appt._id)}
                      >
                        Gửi Feedback
                      </Button>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal
        show={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Gửi Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nội dung</Form.Label>
              <Form.Control
                as="textarea"
                value={feedbackData.content}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, content: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Đánh giá (1-5)</Form.Label>
              <Form.Select
                value={feedbackData.rating}
                onChange={(e) =>
                  setFeedbackData({
                    ...feedbackData,
                    rating: Number(e.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} sao
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFeedbackModal(false)}
          >
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendFeedback}>
            Gửi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AppointmentManagePage;
