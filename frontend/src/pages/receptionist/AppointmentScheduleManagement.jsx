import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Container,
  Spinner,
  Form,
  Pagination,
  Row,
  Col,
  Card,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import "../../assets/css/AppointmentScheduleManagement.css";

// Hàm định dạng ngày giờ
const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Hàm định dạng trạng thái
const getStatusBadge = (status) => {
  const statusMap = {
    pending_confirmation: { text: "Chờ xác nhận", class: "bg-info" },
    confirmed: { text: "Đã xác nhận", class: "bg-primary" },
    rejected: { text: "Bị từ chối", class: "bg-danger" },
    waiting_for_doctor: { text: "Đang xếp hàng", class: "bg-warning" },
    checked_in: { text: "Đã check-in", class: "bg-secondary" },
    in_progress: { text: "Đang khám", class: "bg-primary" },
    completed: { text: "Đã khám", class: "bg-success" },
    canceled: { text: "Đã hủy", class: "bg-secondary" },
    pending_cancel: { text: "Chờ hủy", class: "bg-warning" },
  };
  return statusMap[status] || { text: status, class: "bg-info" };
};

const AppointmentScheduleManagement = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  // Lấy danh sách lịch hẹn
  const fetchAppointments = useCallback(async (page = currentPage, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: itemsPerPage, sort: "appointmentDate", order: "asc" };
      if (status !== "all") params.status = status;

      const res = await axios.get("http://localhost:9999/api/apm", { params });
      if (!res.data?.appointments) {
        throw new Error("Dữ liệu trả về từ API không hợp lệ");
      }

      const { appointments, total, limit } = res.data;
      setAppointments(appointments);
      setTotalPages(Math.ceil(total / limit) || 1);
      setTotalItems(total || 0);
      setError(null);
    } catch (err) {
      console.error("Lỗi tải danh sách lịch hẹn:", err);
      setError(
        err.message === "Network Error"
          ? "Không kết nối được server. Vui lòng kiểm tra backend."
          : `Lỗi: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, itemsPerPage]);

  // Lấy danh sách khoa
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/departments");
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách phòng ban:", err);
      setError("Không tải được danh sách khoa.");
    }
  }, []);

  // Gọi API khi component mount hoặc thay đổi page/status
  useEffect(() => {
    fetchAppointments();
    fetchDepartments();
  }, [fetchAppointments, fetchDepartments]);

  // Xử lý cập nhật trạng thái
  const handleUpdateStatus = useCallback(async (appointmentId, newStatus) => {
    const confirmMessages = {
      confirmed: "Bạn có chắc muốn xác nhận lịch hẹn này?",
      rejected: "Bạn có chắc muốn từ chối lịch hẹn này?",
      canceled: "Bạn có chắc muốn đồng ý hủy lịch hẹn này?",
    };
    if (!window.confirm(confirmMessages[newStatus] || "Bạn có chắc muốn cập nhật trạng thái này?")) {
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
      await axios.put(`http://localhost:9999/api/apm/${appointmentId}/status`, { status: newStatus });

      const successMessages = {
        confirmed: "Đã xác nhận lịch hẹn thành công!",
        rejected: "Đã từ chối lịch hẹn thành công!",
        canceled: "Đã đồng ý hủy lịch hẹn thành công!",
      };
      message.success(successMessages[newStatus] || "Cập nhật trạng thái thành công!");
      fetchAppointments();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      message.error(`Cập nhật thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  }, [fetchAppointments]);

  // Xử lý đẩy vào hàng đợi
  const handlePushToQueue = useCallback(async (appointment) => {
    try {
      setActionLoading((prev) => ({ ...prev, [appointment._id]: true }));
      await axios.post(`http://localhost:9999/api/apm/queue/push/${appointment._id}`, {});
      message.success("Đã đẩy vào hàng đợi thành công!");
      fetchAppointments();
    } catch (err) {
      console.error("Lỗi đẩy vào hàng đợi:", err);
      message.error(`Đẩy vào hàng đợi thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointment._id]: false }));
    }
  }, [fetchAppointments]);

  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Tải lại toàn bộ dữ liệu
  const handleReload = useCallback(() => {
    setStatusFilter("all");
    setCurrentPage(1);
    fetchAppointments(1, "all");
  }, [fetchAppointments]);

  // Sắp xếp danh sách lịch hẹn theo appointmentDate tăng dần
  const filteredAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  }, [appointments]);

  return (
    <Container fluid className="py-5 bg-light">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý lịch hẹn (Lễ tân) - Tổng số: {totalItems}</h4>
          <div>
            <Button variant="secondary" onClick={handleReload} className="me-2">
              Tải lại
            </Button>
            <Button variant="success" onClick={() => navigate("/receptionist/offline-appointment")}>
              Tạo lịch hẹn offline
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-pill shadow-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending_confirmation">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="pending_cancel">Chờ hủy</option>
                <option value="rejected">Bị từ chối</option>
                <option value="waiting_for_doctor">Đang xếp hàng</option>
                <option value="checked_in">Đã check-in</option>
                <option value="in_progress">Đang khám</option>
                <option value="completed">Đã khám</option>
                <option value="canceled">Đã hủy</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">
              <h5>{error}</h5>
              <Button variant="primary" onClick={() => fetchAppointments()}>
                Thử lại
              </Button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-muted text-center">Không tìm thấy lịch hẹn nào.</p>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover className="table-align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>STT</th>
                      <th>Ngày hẹn</th>
                      <th>Bác sĩ</th>
                      <th>Khoa</th>
                      <th>Loại</th>
                      <th>Người dùng</th>
                      <th>SĐT</th>
                      <th>Triệu chứng</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment, index) => (
                      <tr key={appointment._id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{formatDateTime(appointment.appointmentDate)}</td>
                        <td>{appointment.doctorId?.name || "N/A"}</td>
                        <td>{appointment.department?.name || "N/A"}</td>
                        <td>{appointment.type === "Online" ? "Trực tuyến" : "Trực tiếp"}</td>
                        <td>{appointment.profileId?.name || "N/A"}</td>
                        <td>{appointment.profileId?.phone || "N/A"}</td>
                        <td>{appointment.symptoms || "N/A"}</td>
                        <td>
                          <Badge className={getStatusBadge(appointment.status).class}>
                            {getStatusBadge(appointment.status).text}
                          </Badge>
                        </td>
                        <td>
                          {actionLoading[appointment._id] ? (
                            <Spinner animation="border" size="sm" />
                          ) : appointment.status === "pending_confirmation" ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateStatus(appointment._id, "confirmed")}
                                className="me-2"
                              >
                                Xác nhận
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUpdateStatus(appointment._id, "rejected")}
                              >
                                Từ chối
                              </Button>
                            </>
                          ) : appointment.status === "confirmed" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handlePushToQueue(appointment)}
                            >
                              Đẩy vào hàng đợi
                            </Button>
                          ) : appointment.status === "pending_cancel" ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateStatus(appointment._id, "canceled")}
                                className="me-2"
                              >
                                Đồng ý hủy
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUpdateStatus(appointment._id, "confirmed")}
                              >
                                Từ chối hủy
                              </Button>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <small className="text-muted">
                  Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} lịch hẹn
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((page) => (
                    <Pagination.Item
                      key={page + 1}
                      active={page + 1 === currentPage}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AppointmentScheduleManagement;