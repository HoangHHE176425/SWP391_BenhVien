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
    const [filterStatus, setFilterStatus] = useState("booked");

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [feedbackData, setFeedbackData] = useState({ content: "", rating: 5 });

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(
                `/api/user/user?page=${currentPage}&limit=${appointmentsPerPage}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = res.data;
            const appointmentsData = Array.isArray(data)
                ? data
                : data.appointments || [];

            setAppointments(appointmentsData);
            setTotalAppointments(data.totalAppointments || appointmentsData.length);
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
    }, [currentPage]);

    const handleCancel = async (id) => {
        if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
        try {
            await axios.post(
                `http://localhost:9999/api/user/cancel/${id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAppointments((prev) =>
                prev.map((a) => (a._id === id ? { ...a, status: "Canceled" } : a))
            );
        } catch (err) {
            console.error("Cancel failed", err);
            alert("Hủy lịch hẹn thất bại. Vui lòng thử lại.");
        }
    };

    const openFeedbackModal = (appointmentId) => {
        setSelectedAppointmentId(appointmentId);
        setShowFeedbackModal(true);
    };

    const handleSendFeedback = async () => {
        try {
            await axios.post(
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
            setShowFeedbackModal(false);
            alert("Gửi phản hồi thành công!");
        } catch (err) {
            console.error("Gửi feedback thất bại:", err);
            alert("Gửi phản hồi thất bại.");
        }
    };

    const filteredAppointments =
        filterStatus === "booked"
            ? appointments.filter((a) => a.status === "Booked")
            : appointments;

    const totalPages = Math.ceil(totalAppointments / appointmentsPerPage);

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="text-primary fw-bold">Lịch hẹn của bạn</h2>
                <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: 200 }}
                >
                    <option value="all">Tất cả lịch hẹn</option>
                    <option value="booked">Lịch đã đặt</option>
                </Form.Select>
            </div>

            {loading ? (
                <Spinner animation="border" variant="primary" />
            ) : filteredAppointments.length === 0 ? (
                <Alert variant="info">Không có lịch hẹn nào phù hợp.</Alert>
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
                            {filteredAppointments.map((app) => (
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
                                                (app.status === "Booked"
                                                    ? "bg-warning"
                                                    : app.status === "Completed"
                                                        ? "bg-success"
                                                        : app.status === "Canceled"
                                                            ? "bg-secondary"
                                                            : "bg-info")
                                            }
                                        >
                                            {app.status === "Booked"
                                                ? "Đã đặt"
                                                : app.status === "Completed"
                                                    ? "Đã khám"
                                                    : app.status === "Canceled"
                                                        ? "Đã hủy"
                                                        : app.status}
                                        </span>
                                    </td>
                                    <td>
                                        {app.status === "Booked" ? (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleCancel(app._id)}
                                            >
                                                Hủy
                                            </Button>
                                        ) : app.status === "Completed" ? (
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
            <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Gửi Feedback</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Nội dung</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={feedbackData.content}
                                onChange={(e) =>
                                    setFeedbackData({ ...feedbackData, content: e.target.value })
                                }
                            />
                        </Form.Group>
                        <Form.Group className="mt-3">
                            <Form.Label>Đánh giá</Form.Label>
                            <Form.Select
                                value={feedbackData.rating}
                                onChange={(e) =>
                                    setFeedbackData({ ...feedbackData, rating: Number(e.target.value) })
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
                    <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleSendFeedback}>
                        Gửi
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ListAppointmentPage;
