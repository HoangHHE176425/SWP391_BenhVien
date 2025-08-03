import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { Table, Button, Spinner, Alert, Form, Modal } from "react-bootstrap";

const ListAppointmentPage = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);
  // Thêm state để quản lý sort theo ngày
  const [sortDirection, setSortDirection] = useState("desc");

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ content: "", rating: 5 });

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("/api/apm", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: appointmentsPerPage,
        },
      });

      // Xử lý response từ API
      const { appointments, total } = res.data;
      // Sort theo ngày
      const sortedAppointments = [...(appointments || [])].sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
      setAppointments(sortedAppointments);
      setTotalAppointments(total || 0);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu lịch hẹn:", err);
      setAppointments([]);
      setTotalAppointments(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [currentPage, sortDirection]); // Thêm sortDirection vào dependency

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      const response = await axios.post(
        `/api/user/cancel/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Cập nhật trạng thái dựa trên response từ backend
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: response.data.appointment.status } : a))
      );
      alert(response.data.message); // Hiển thị message từ backend
    } catch (err) {
      console.error("Hủy lịch hẹn thất bại:", err.response?.data || err);
      alert(err.response?.data?.message || "Hủy lịch hẹn thất bại. Vui lòng thử lại.");
    }
  };

  const openFeedbackModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setFeedbackData({ content: "", rating: 5 }); // Reset dữ liệu feedback khi mở modal
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = async () => {
    if (!feedbackData.content.trim()) {
      alert("Vui lòng nhập nội dung phản hồi!");
      return;
    }

    try {
      console.log("Token:", token);
      console.log("Gửi feedback với dữ liệu:", { content: feedbackData.content, rating: feedbackData.rating, appointmentId: selectedAppointmentId });
      const response = await axios.post(
        "/api/user/createFeedback",
        {
          content: feedbackData.content,
          rating: feedbackData.rating,
          appointmentId: selectedAppointmentId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Response from server:", response.data);
      setShowFeedbackModal(false);
      setFeedbackData({ content: "", rating: 5 });
      alert("Gửi phản hồi thành công!");
    } catch (err) {
      console.error("Lỗi gửi feedback:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Gửi phản hồi thất bại. Vui lòng thử lại.");
    }
  };

  
  const totalPages = Math.ceil(totalAppointments / appointmentsPerPage);

  return (
    <div className="container py-4">
      <h2 className="text-primary fw-bold">Lịch hẹn của bạn</h2>

      {/* Thêm nút sort theo ngày */}
      <div className="mb-3">
        <Button
          variant={sortDirection === "asc" ? "primary" : "outline-primary"}
          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          className="me-2"
        >
          Sắp xếp lịch hẹn theo {sortDirection === "asc" ? "ngày gần nhất" : "ngày xa nhất"}
        </Button>
      </div>

      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : appointments.length === 0 ? (
        <Alert variant="info">Không có lịch hẹn nào.</Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="align-middle">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Hồ sơ bệnh nhân</th>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app._id}>
                  <td>{app.doctorId?.name || "(Không rõ)"}</td>
                  <td>{app.department?.name || app.doctorId?.department || ""}</td>
                  <td>{app.profileId?.name || "(Không rõ)"}</td>
                  <td>
                    {app.appointmentDate
                      ? new Date(app.appointmentDate).toLocaleString("vi-VN")
                      : ""}
                  </td>
                  <td>{app.type === "Online" ? "Online" : "Tại viện"}</td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (app.status === "pending_confirmation"
                          ? "bg-info"
                          : app.status === "confirmed" || app.status === "Booked"
                            ? "bg-primary"
                            : app.status === "rejected"
                              ? "bg-danger"
                              : app.status === "queued" || app.status === "waiting_for_doctor"
                                ? "bg-warning"
                                : app.status === "checked_in"
                                  ? "bg-secondary"
                                  : app.status === "in_progress"
                                    ? "bg-primary"
                                    : app.status === "completed" || app.status === "done"
                                      ? "bg-success"
                                      : app.status === "canceled"
                                        ? "bg-secondary"
                                        : app.status === "pending_cancel"
                                          ? "bg-warning"  // Badge vàng cho chờ duyệt hủy
                                          : "bg-info")
                      }
                    >
                      {app.status === "pending_confirmation"
                        ? "Chờ xác nhận"
                        : app.status === "confirmed" || app.status === "Booked"
                          ? "Đã xác nhận"
                          : app.status === "rejected"
                            ? "Bị từ chối"
                            : app.status === "queued" || app.status === "waiting_for_doctor"
                              ? "Đang xếp hàng"
                              : app.status === "checked_in"
                                ? "Đã check-in"
                                : app.status === "in_progress"
                                  ? "Đang khám"
                                  : app.status === "completed" || app.status === "done"
                                    ? "Đã khám"
                                    : app.status === "canceled"
                                      ? "Đã hủy"
                                      : app.status === "pending_cancel"
                                        ? "Chờ hủy"  // Hiển thị "Chờ hủy" cho trạng thái mới
                                        : app.status}
                    </span>
                  </td>
                  <td>
                    {['confirmed', 'pending_confirmation'].includes(app.status) ? (  // Chỉ hiển thị nút nếu trạng thái cho phép hủy
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(app._id)}
                      >
                        Hủy
                      </Button>
                    ) : app.status === "completed" || app.status === "done" ? (
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => openFeedbackModal(app._id)}
                      >
                        Gửi Feedback
                      </Button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <h6 className="text-muted">Tổng số lịch hẹn: {totalAppointments}</h6>
        <div>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="me-2"
          >
            Trước
          </Button>
          <span>{`Trang ${currentPage} / ${totalPages}`}</span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="ms-2"
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal
        show={showFeedbackModal}
        onHide={() => {
          setShowFeedbackModal(false);
          setFeedbackData({ content: "", rating: 5 }); // Reset khi đóng
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Gửi Phản Hồi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nội dung phản hồi</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={feedbackData.content}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, content: e.target.value })
                }
                placeholder="Nhập nội dung phản hồi của bạn..."
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Đánh giá</Form.Label>
              <Form.Select
                value={feedbackData.rating}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, rating: Number(e.target.value) })
                }
              >
                <option value="5">5 sao - Rất tốt</option>
                <option value="4">4 sao - Tốt</option>
                <option value="3">3 sao - Trung bình</option>
                <option value="2">2 sao - Kém</option>
                <option value="1">1 sao - Rất kém</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowFeedbackModal(false);
              setFeedbackData({ content: "", rating: 5 });
            }}
          >
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendFeedback}>
            Gửi Phản Hồi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ListAppointmentPage;