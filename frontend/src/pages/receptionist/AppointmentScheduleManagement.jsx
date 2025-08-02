import React, { useEffect, useState } from "react";
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
import "../../assets/css/AppointmentScheduleManagement.css";
import { message } from "antd";

const AppointmentScheduleManagement = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [doctorRoomMapping, setDoctorRoomMapping] = useState({});
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Lấy danh sách lịch hẹn
  const fetchAppointments = async (search = "", status = statusFilter) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (status !== "all") params.status = status;

      const res = await axios.get("http://localhost:9999/api/apm", { params });
      console.log("[DEBUG] Response từ API:", res.data);

      if (!res.data || !res.data.appointments) {
        throw new Error("Dữ liệu trả về từ API không hợp lệ");
      }

      const { appointments, total, limit } = res.data;
      const calculatedTotalPages = Math.ceil(total / limit) || 1;

      setAppointments(appointments);
      setFilteredAppointments(appointments);
      setTotalPages(calculatedTotalPages);
      setTotalItems(total || 0);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải danh sách lịch hẹn:", err.response?.data || err.message);
      setError(err.message === "Network Error" ? "Không kết nối được server. Vui lòng kiểm tra backend." : "Không tải được lịch hẹn. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Lấy danh sách khoa
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/departments");
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi tải danh sách phòng ban:", error.response?.data || error.message);
      setError("Không tải được phòng ban.");
    }
  };

  // // Lấy mapping phòng - bác sĩ
  // const fetchDoctorRoomMapping = async () => {
  //   try {
  //     const res = await axios.get("http://localhost:9999/api/apm/doctor-room-mapping");
  //     setDoctorRoomMapping(res.data.mapping || {});
  //   } catch (error) {
  //     console.error("Lỗi tải mapping phòng - bác sĩ:", error.response?.data || error.message);
  //     message.error("Không tải được mapping phòng - bác sĩ.");
  //   }
  // };

  useEffect(() => {
    fetchAppointments(statusFilter);
    fetchDepartments();
    // fetchDoctorRoomMapping();
  }, [currentPage, statusFilter]);

  // Định dạng ngày giờ
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Xác nhận hoặc từ chối lịch (Giai đoạn 2)
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === "confirmed" ? "xác nhận" : "từ chối"} lịch hẹn này?`)) return;

    try {
      const updateRes = await axios.patch(`http://localhost:9999/api/apm/${appointmentId}/status`, { status: newStatus });
      console.log("Cập nhật trạng thái thành công:", updateRes.data);
      message.success(`Đã ${newStatus === "confirmed" ? "xác nhận" : "từ chối"} lịch hẹn thành công!`);

      fetchAppointments(statusFilter);
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err.response?.data || err.message);
      message.error("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  // Đẩy vào hàng đợi (Giai đoạn 3)
  const handlePushToQueue = async (appointment) => {
    setIsFormLoading(true);

    try {
      const doctorId = appointment.doctorId?._id || appointment.doctorId;
      const room = appointment.doctorId?.room;

      if (!room) {
        message.error("Không tìm thấy phòng ứng với bác sĩ này");
        return;
      }

      const payload = { room };
      const queueRes = await axios.post(`http://localhost:9999/api/apm/queue/push/${appointment._id}`, payload);
      console.log("Pushed to queue:", queueRes.data);
      message.success("Đã đẩy vào hàng đợi thành công với phòng " + room + "!");4

      fetchAppointments(statusFilter);
    } catch (queueError) {
      console.error("Lỗi khi đẩy vào hàng đợi:", queueError.response?.data || queueError.message);
      message.error("Đẩy vào hàng đợi thất bại: " + (queueError.response?.data?.message || queueError.message));
    } finally {
      setIsFormLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleReload = () => {
    setStatusFilter("all");
    fetchAppointments();
  };

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
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">
              <h5>{error}</h5>
              <Button variant="primary" onClick={() => fetchAppointments(statusFilter)}>
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
                      <th>Phòng</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment, index) => (
                      <tr key={appointment._id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{formatDateTime(appointment.appointmentDate)}</td>
                        <td>{appointment.doctorId?.name || "Chưa có"}</td>
                        <td>{appointment.department?.name || "Chưa có"}</td>
                        <td>{appointment.type === "Online" ? "Trực tuyến" : "Trực tiếp"}</td>
                        <td>{appointment.profileId?.name || "Chưa có"}</td>
                        <td>{appointment.profileId?.phone || "Chưa có"}</td>
                        <td>{appointment.symptoms || "Chưa có"}</td>
                        <td>{appointment.doctorId?.room || "Chưa có"}</td>
                        <td>
                          <span
                            className={`badge text-bg-${appointment.status === "pending_confirmation"
                              ? "info"
                              : appointment.status === "confirmed"
                                ? "primary"
                                : appointment.status === "waiting_for_doctor"
                                  ? "warning"
                                  : appointment.status === "rejected"
                                    ? "danger"
                                    : "secondary"
                              }`}
                          >
                            {appointment.status === "pending_confirmation"
                              ? "Chờ xác nhận"
                              : appointment.status === "confirmed"
                                ? "Đã xác nhận"
                                : appointment.status === "waiting_for_doctor"
                                  ? "Đang xếp hàng"
                                  : appointment.status === "rejected"
                                    ? "Bị từ chối"
                                    : "Trạng thái không xác định"}
                          </span>
                        </td>
                        <td>
                          {appointment.status === "pending_confirmation" ? (
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
                              className="me-2"
                              disabled={isFormLoading}
                            >
                              Đẩy vào hàng đợi
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

              <div className="d-flex justify-content-between align-items-center mt-4">
                <small className="text-muted">
                  Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((page) => (
                    <Pagination.Item
                      key={page + 1}
                      active={page + 1 === currentPage}
                      onClick={() => setCurrentPage(page + 1)}
                    >
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
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