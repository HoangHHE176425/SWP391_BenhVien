import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Container,
  Spinner,
  Modal,
  Form,
  InputGroup,
  FormControl,
  Pagination,
  Row,
  Col,
  Card,
  Badge,
} from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import axios from "axios";
import "../../assets/css/AppointmentScheduleManagement.css";
import { message } from 'antd';

const AppointmentScheduleManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);


  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
  appointmentDate: "",
  department: "",
  doctorId: "",
  timeSlot: "",
  type: "Offline",
  status: "Booked",
  reminderSent: false,
  identityNumber: "",
});

  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);

const handleViewProfile = async (profileId) => {
  try {
    const token = localStorage.getItem("token");
    const id = typeof profileId === "object" ? profileId._id : profileId;
    
    const response = await axios.get(`http://localhost:9999/api/appointmentScheduleManagement/profile/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setSelectedProfile(response.data.data);
    setOpenProfileDialog(true);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm thông tin chi tiết hồ sơ:", error);
  }
};



useEffect(() => {
  fetchAppointments();
  fetchDepartments();
  fetchUsers();
}, [
  currentPage,
  statusFilter,
  departmentFilter,
  searchTerm,
  startDate,
  endDate,
  form.identityNumber,
]);



  useEffect(() => {
  if (form.appointmentDate && form.department) {
    fetchAvailableDoctors(form.appointmentDate, form.department);
    
    // ❗ Reset doctor + timeSlot mỗi khi ngày hoặc department thay đổi
    setForm((prev) => ({
      ...prev,
      doctorId: "",
      timeSlot: "",
    }));
    setSchedules([]);
  } else {
    setAvailableDoctors([]);
    setForm((prev) => ({
      ...prev,
      doctorId: "",
      timeSlot: "",
    }));
    setSchedules([]);
  }
}, [form.appointmentDate, form.department]);


useEffect(() => {
  if (form.doctorId) {
    fetchSchedules(form.doctorId, form.appointmentDate);
    
    // ✅ reset timeSlot vì lịch đã đổi
    setForm((prev) => ({ ...prev, timeSlot: "" }));
  }
}, [form.doctorId]);

  useEffect(() => {
  if (form.doctorId && form.appointmentDate) {
    fetchSchedules(form.doctorId, form.appointmentDate);
    setForm((prev) => ({
      ...prev,
      timeSlot: "", // ✅ reset lại slot mỗi lần chọn bác sĩ
    }));
  }
}, [form.doctorId, form.appointmentDate]);


  const [resolvedProfile, setResolvedProfile] = useState(null);

  useEffect(() => {
    if (
      form.identityNumber &&
      form.appointmentDate &&
      form.department &&
      form.doctorId
    ) {
      fetchProfilesByIdentity(form.identityNumber);
    }
  }, [form.identityNumber, form.appointmentDate, form.department, form.doctorId]);


const [resolvedProfiles, setResolvedProfiles] = useState([]);
const [selectedProfileId, setSelectedProfileId] = useState("");

const fetchProfilesByIdentity = async (identityNumber) => {
  if (!identityNumber || identityNumber.trim() === "") return;

  try {
    const res = await axios.get(`http://localhost:9999/api/appointmentScheduleManagement/profileByIdentity`, {
      params: { identityNumber }
    });

    if (Array.isArray(res.data)) {
      if (res.data.length === 0) {
        // Chỉ hiển thị thông báo khi tìm xong mà không có profile
        message.error("No profiles found with this identity number.");
        setResolvedProfiles([]);
        setSelectedProfileId("");
      } else {
        setResolvedProfiles(res.data);
        setSelectedProfileId(res.data[0]._id); // hoặc để người dùng chọn nếu có nhiều
      }
    } else {
      console.error("Định dạng phản hồi không mong đợi:", res.data);
      message.error("Phản hồi không mong muốn từ máy chủ.");
    }
  } catch (err) {
    console.error("Lỗi khi tìm kiếm hồ sơ theo danh tính:", err);
    setResolvedProfiles([]);
    setSelectedProfileId("");
  }
};



useEffect(() => {
  if (selectedProfileId) {
    setForm((prev) => ({ ...prev, profileId: selectedProfileId }));
  }
}, [selectedProfileId]);

  const fetchAppointments = async () => {
  try {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
    };
    if (statusFilter !== "all") params.status = statusFilter;
    if (departmentFilter !== "all") params.department = departmentFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (form.identityNumber) params.identityNumber = form.identityNumber; // ✅ THÊM DÒNG NÀY

    const res = await axios.get(
      "http://localhost:9999/api/appointmentScheduleManagement",
      { params }
    );
    const { appointments, pagination } = res.data;
    setAppointments(appointments || []);
    setFilteredAppointments(appointments || []);
    setTotalPages(pagination.totalPages || 1);
    setTotalItems(pagination.total || 0);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Không tải được lịch hẹn. Vui lòng thử lại.");
    setLoading(false);
  }
};


const fetchDepartments = async () => {
  try {
    const res = await axios.get("http://localhost:9999/api/appointmentScheduleManagement/departments");
    setDepartments(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Không thể tìm được các phòng ban: ", error);
    setError("Không tải được phòng ban.");
  }
};


  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:9999/api/appointmentScheduleManagement/users"
      );
      setUsers(res.data);
    } catch (err) {
      console.error("Không thể tìm nạp người dùng:", err);
      setError("Không tải được người dùng.");
    }
  };

    const fetchAvailableDoctors = async (date, departmentId) => {
    try {
      setIsFormLoading(true);

      const formattedDate = new Date(date).toISOString().split("T")[0];

      const res = await axios.get(
        "http://localhost:9999/api/appointmentScheduleManagement/doctors",
        {
          params: { department: departmentId, date: formattedDate },
        }
      );

      setAvailableDoctors(res.data || []);
    } catch (error) {
      console.error("Không thể tìm được bác sĩ:", error);
      setAvailableDoctors([]);
      setError("Không tìm được bác sĩ phù hợp.");
    } finally {
      setIsFormLoading(false);
    }
  };


  const fetchSchedules = async (doctorId, date) => {
  try {
    const res = await axios.get(
      `http://localhost:9999/api/appointmentScheduleManagement/schedules/${doctorId}`,
      {
        params: { date: new Date(date).toISOString().split("T")[0] }, // ⚠️ dùng yyyy-mm-dd
      }
    );

    //console.log("📥 Raw fetched schedules:", res.data);

const matchingSchedule = res.data.find(
  (s) =>
    new Date(s.date).toISOString().slice(0, 10) ===
    new Date(date).toISOString().slice(0, 10)
);

if (matchingSchedule) {
  //console.log("✅ Found matching schedule:", matchingSchedule);
  //console.log("⏱ Extracted timeSlots:", matchingSchedule.timeSlots);
  setSchedules(matchingSchedule.timeSlots || []);
} else {
  console.warn("⚠️ Không tìm thấy lịch trình phù hợp cho ngày đã chọn:", date);
  setSchedules([]);
}

  } catch (error) {
    console.error("❌ Không thể lấy lịch trình:", error);
    setSchedules([]);
  }
};





  const fetchProfilesByUser = async (userId) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.error("Định dạng userId không hợp lệ:", userId);
        return;
      }
      const res = await axios.get(
        `http://localhost:9999/api/appointmentScheduleManagement/profiles/${userId}`
      );
      setProfiles(res.data);
    } catch (err) {
      console.error("Không thể tải hồ sơ:", err);
      setProfiles([]);
    }
  };

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
const formatYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10); // yyyy-MM-dd
};


const validateForm = () => {
  const errors = {};
  if (!form.appointmentDate)
    errors.appointmentDate = "Vui lòng chọn ngày hẹn.";
  if (!form.department) errors.department = "Vui lòng chọn một khoa.";
  if (availableDoctors.length > 0 && !form.doctorId)
    errors.doctorId = "Vui lòng chọn bác sĩ.";
  if (form.doctorId && schedules.length > 0 && !form.timeSlot)
    errors.timeSlot = "Vui lòng chọn khung thời gian.";
  if (!form.identityNumber)
    errors.identityNumber = "Vui lòng nhập số nhận dạng.";
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};


  function handleAddNew() {
  setCurrentAppointment(null);
  setForm({
    appointmentDate: "",
    department: "",
    doctorId: "",
    timeSlot: "",
    type: "Offline",
    status: "Booked",
    reminderSent: false,
    identityNumber: "",
  });
  setAvailableDoctors([]);
  setSchedules([]);
  setFormErrors({});
  setDoctorSearchTerm("");
  setUserSearchTerm("");
  setShowModal(true);
}


function handleEdit(appointment) {
  setCurrentAppointment(appointment);
  setForm({
    appointmentDate: appointment.appointmentDate
      ? appointment.appointmentDate.slice(0, 10)
      : "",
    department: appointment.department || "",
    doctorId: appointment.doctorId || "",
    timeSlot: appointment.appointmentDate || "",
    type: appointment.type || "Offline",
    status: appointment.status || "Booked",
    reminderSent: appointment.reminderSent || false,
    identityNumber: "",
  });
  setFormErrors({});
  setDoctorSearchTerm("");
  setUserSearchTerm("");
  setShowModal(true);
}


  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }

function handleResetForm() {
  setForm({
    appointmentDate: "",
    department: "",
    doctorId: "",
    timeSlot: "",
    type: "Offline",
    status: "Booked",
    reminderSent: false,
    identityNumber: "",
  });
  setAvailableDoctors([]);
  setSchedules([]);
  setFormErrors({});
  setDoctorSearchTerm("");
  setUserSearchTerm("");
}


  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setForm((prev) => ({ ...prev, identityNumber: "" }));
  }

async function handleSubmit() {
  if (!validateForm()) return;

  // console.log("📋 === BẮT ĐẦU GỬI LỊCH HẸN ===");
  // console.log("🆔 identityNumber:", form.identityNumber);
  // console.log("📅 form.appointmentDate:", form.appointmentDate);
  // console.log("🏥 form.department:", form.department);
  // console.log("👨‍⚕️ form.doctorId:", form.doctorId);
  // console.log("⏰ form.timeSlot:", form.timeSlot);
  // console.log("🧾 selectedProfileId:", selectedProfileId);
  // console.log("📂 resolvedProfiles:", resolvedProfiles);

  const selectedProfile = resolvedProfiles.find((p) => p._id === selectedProfileId);
  if (!selectedProfile) {
    console.warn("⚠️ Không tìm thấy hồ sơ tương ứng.");
    message.error("Hồ sơ chưa được giải quyết. Vui lòng kiểm tra số nhận dạng.");
    return;
  }

  try {
    setIsFormLoading(true);

    if (!form.timeSlot) {
      console.warn("⚠️ Thiếu timeSlot.");
      message.error("Thiếu khoảng thời gian.");
      return;
    }

    const selectedSlot = schedules.find(slot => slot.startTime === form.timeSlot);
    if (!selectedSlot) {
      console.warn("⚠️ Không tìm thấy slot trong lịch trình:", form.timeSlot);
      message.error("Không tìm thấy khoảng thời gian đã chọn trong lịch trình hiện tại.");
      return;
    }

    // ✅ Ghép ngày hẹn với giờ từ timeSlot
    const appointmentDate = new Date(form.appointmentDate);
    const slotTime = new Date(selectedSlot.startTime);

    const combinedDate = new Date(appointmentDate);
    combinedDate.setHours(slotTime.getHours());
    combinedDate.setMinutes(slotTime.getMinutes());
    combinedDate.setSeconds(0);
    combinedDate.setMilliseconds(0);

    const finalDate = combinedDate.toISOString();

    console.log("📆 Final combined appointmentDate:", finalDate);
    console.log("⏱ Slot được chọn:", {
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: selectedSlot.status
    });

    const payload = {
      appointmentDate: finalDate,
      department: form.department,
      doctorId: form.doctorId,
      type: form.type,
      status: form.status,
      reminderSent: form.reminderSent,
      profileId: selectedProfile._id,
      userId: selectedProfile.userId,
      timeSlot: {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: selectedSlot.status, 
      },
    };

    console.log("📦 Payload sẽ gửi:", payload);

    if (currentAppointment) {
      console.log("✏️ Đang cập nhật lịch hẹn ID:", currentAppointment._id);
      await axios.put(
        `http://localhost:9999/api/appointmentScheduleManagement/${currentAppointment._id}`,
        payload
      );
      message.success("Đã cập nhật cuộc hẹn thành công!");
    } else {
      console.log("🆕 Đang tạo lịch hẹn mới...");
      await axios.post(
        "http://localhost:9999/api/appointmentScheduleManagement",
        payload
      );
      message.success("Đã tạo cuộc hẹn thành công!");
    }

    setShowModal(false);
    fetchAppointments();
  } catch (error) {
    console.error("❌ Lỗi khi gửi cuộc hẹn:", error);
    console.log("💥 Chi tiết phản hồi lỗi:", error.response?.data || error);
    message.error("Error: " + (error.response?.data?.message || error.message));
  } finally {
    setIsFormLoading(false);
    console.log("📋 === KẾT THÚC GỬI LỊCH HẸN ===");
  }
}







  function handleDeleteClick(appointmentId) {
    setDeleteAppointmentId(appointmentId);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
  try {
    const appointmentToDelete = appointments.find((a) => a._id === deleteAppointmentId);
    if (!appointmentToDelete) {
      message.error("Không tìm thấy thông tin cuộc hẹn.");
      return;
    }

    // ✅ Kiểm tra slot có tồn tại không
    if (!appointmentToDelete.timeSlot || !appointmentToDelete.timeSlot.startTime || !appointmentToDelete.timeSlot.endTime) {
      message.error("Không có thông tin khung giờ để xóa.");
      return;
    }

    const payload = {
      doctorId: appointmentToDelete.doctorId,
      appointmentDate: appointmentToDelete.appointmentDate,
      timeSlot: appointmentToDelete.timeSlot, // ✅ CẦN PHẢI GỬI CẢ SLOT
    };

    console.log("📦 Payload gửi khi DELETE:", payload);

    await axios.delete(
      `http://localhost:9999/api/appointmentScheduleManagement/${deleteAppointmentId}`,
      {
        data: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    setShowDeleteModal(false);
    setDeleteAppointmentId(null);
    fetchAppointments();
    message.success("Đã xóa cuộc hẹn thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi xoá:", error);
    message.error(
      "Xóa không thành công: " + (error.response?.data?.message || error.message)
    );
  }
}




  function cancelDelete() {
    setShowDeleteModal(false);
    setDeleteAppointmentId(null);
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const filteredDoctors = availableDoctors.filter((doc) =>
    doc.name.toLowerCase().includes(doctorSearchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (user.phone &&
        user.phone.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.user_code &&
        user.user_code.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <Container fluid className="py-5 bg-light">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý lịch hẹn</h4>
          <Button variant="success" onClick={handleAddNew} className="rounded-pill px-4">
            <FaPlus className="me-2" /> Thêm lịch hẹn
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
  <Col md={3}>
    <InputGroup className="rounded-pill overflow-hidden shadow-sm">
      <InputGroup.Text className="bg-white border-0">
        <FaSearch />
      </InputGroup.Text>
      <FormControl
        placeholder="Tìm bác sĩ, người dùng, số định danh..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border-0"
      />
      {searchTerm && (
        <InputGroup.Text
          className="bg-white border-0"
          onClick={handleClearFilters}
          style={{ cursor: "pointer" }}
        >
          <FaTimes />
        </InputGroup.Text>
      )}
    </InputGroup>
  </Col>
  <Col md={2}>
    <Form.Select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="rounded-pill shadow-sm"
    >
      <option value="all">Tất cả trạng thái</option>
      <option value="Booked">Đã đặt</option>
      <option value="In-Progress">Đang diễn ra</option>
      <option value="Completed">Hoàn thành</option>
      <option value="Canceled">Đã hủy</option>
    </Form.Select>
  </Col>

  <Col md={3}>
    <Form.Select
      value={departmentFilter}
      onChange={(e) => setDepartmentFilter(e.target.value)}
      className="rounded-pill shadow-sm"
    >
      <option value="all">Tất cả khoa</option>
      {departments.map((dept) => (
        <option key={dept._id} value={dept._id}>
          {dept.name}
        </option>
      ))}
    </Form.Select>
  </Col>

  <Col md={2}>
    <Button
      variant="outline-primary"
      onClick={handleClearFilters}
      className="rounded-pill w-100"
    >
      Xóa bộ lọc
    </Button>
  </Col>
</Row>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Ngày bắt đầu"
                className="rounded-pill shadow-sm"
              />
            </Col>
            <Col md={6}>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Ngày kết thúc"
                className="rounded-pill shadow-sm"
              />
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
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
                      <th>Hồ sơ</th>
                      <th>Trạng thái</th>
                      <th>Nhắc nhở</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment, index) => (
                      <tr key={appointment._id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{formatDateTime(appointment.appointmentDate)}</td>
                        <td>{appointment.doctorName || "Chưa có"}</td>
                        <td>
                          {
                            departments.find((d) => d._id.toString() === appointment.department?.toString())?.name ||
                            "Không rõ"
                          }
                        </td>
                        <td>{appointment.type === "Online" ? "Trực tuyến" : "Trực tiếp"}</td>
                        <td>{appointment.userName || "Chưa có"}</td>
                        <td>{appointment.userPhone || "Chưa có"}</td>
                        <td>
                          {appointment.profileName ? (
                            <Button
                              variant="link"
                              className="p-0 text-decoration-underline text-primary"
                              onClick={() =>
                                handleViewProfile(appointment.profileId?._id || appointment.profileId)
                              }
                            >
                              {appointment.profileName}
                            </Button>
                          ) : (
                            "Không có"
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge text-bg-${
                              appointment.status === "Booked"
                                ? "warning"
                                : appointment.status === "In-Progress"
                                ? "info"
                                : appointment.status === "Completed"
                                ? "success"
                                : "secondary"
                            }`}
                          >
                            {appointment.status === "Booked"
                              ? "Đã đặt"
                              : appointment.status === "In-Progress"
                              ? "Đang khám"
                              : appointment.status === "Completed"
                              ? "Hoàn thành"
                              : "Đã hủy"}
                          </span>
                        </td>
                        <td>
                          <Badge bg={appointment.reminderSent ? "success" : "secondary"}>
                            {appointment.reminderSent ? "Đã gửi" : "Chưa gửi"}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(appointment)}>
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(appointment._id)}>
                            <FaTrash />
                          </Button>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{currentAppointment ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày hẹn</Form.Label>
                  <Form.Control
                    type="date"
                    name="appointmentDate"
                    value={form.appointmentDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        appointmentDate: value,
                        doctorId: "",
                        timeSlot: "",
                      }));
                      setAvailableDoctors([]);
                      setSchedules([]);
                    }}
                    className="rounded-pill"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Khoa</Form.Label>
                  <Form.Select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    disabled={!form.appointmentDate}
                    className="rounded-pill"
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bác sĩ</Form.Label>
                  <Form.Select
                    name="doctorId"
                    value={form.doctorId}
                    onChange={handleChange}
                    className="rounded-pill"
                  >
                    <option value="">Chọn bác sĩ</option>
                    {availableDoctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>{doc.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thời gian</Form.Label>
                  <Form.Select
                    name="timeSlot"
                    value={form.timeSlot}
                    onChange={handleChange}
                    className="rounded-pill"
                  >
                    <option value="">Chọn thời gian</option>
                    {schedules
                      .filter(slot => slot.status === "Available")
                      .map((slot, i) => (
                        <option key={i} value={slot.startTime}>
                          {new Date(slot.startTime).toLocaleTimeString("en-GB")} - {new Date(slot.endTime).toLocaleTimeString("en-GB")}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Số nhận dạng</Form.Label>
              <InputGroup className="rounded-pill overflow-hidden shadow-sm">
                <Form.Control
                  type="text"
                  name="identityNumber"
                  placeholder="Nhập số nhận dạng"
                  value={form.identityNumber}
                  onChange={(e) => {
                    handleChange(e);
                    setResolvedProfiles([]);
                    setSelectedProfileId("");
                  }}
                  className="border-0"
                />
                <Button variant="outline-primary" onClick={() => fetchProfilesByIdentity(form.identityNumber)} className="rounded-pill">
                  Tìm kiếm
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chọn Hồ sơ</Form.Label>
              <Form.Select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                disabled={resolvedProfiles.length === 0}
                className="rounded-pill"
              >
                <option value="">
                  {resolvedProfiles.length === 0 ? "No profiles found" : "Select a profile"}
                </option>
                {resolvedProfiles.map((profile) => (
                  <option key={profile._id} value={profile._id}>
                    {profile.name} - {new Date(profile.dateOfBirth).toLocaleDateString()} ({profile.gender})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kiểu</Form.Label>
                  <Form.Select name="type" value={form.type} onChange={handleChange} className="rounded-pill">
                    <option value="Online">Trực tuyến</option>
                    <option value="Offline">Ngoại tuyến</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select name="status" value={form.status} onChange={handleChange} className="rounded-pill">
                    <option value="Booked">Đã đặt chỗ</option>
                    <option value="In-Progress">Đang khám</option>
                    <option value="Completed">Hoàn thành</option>
                    <option value="Canceled">Đã hủy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              type="checkbox"
              label="Đã gửi lời nhắc nhở"
              name="reminderSent"
              checked={form.reminderSent}
              onChange={handleChange}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4">
            {currentAppointment ? "Lưu" : "Thêm"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={cancelDelete} centered size="sm">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xóa cuộc hẹn này không?</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={cancelDelete} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="rounded-pill px-4">
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openProfileDialog}
        onHide={() => setOpenProfileDialog(false)}
        centered
      >
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Chi tiết hồ sơ bệnh nhân</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProfile ? (
            <>
              <p><strong>Tên:</strong> {selectedProfile.name}</p>
              <p><strong>Số định danh:</strong> {selectedProfile.identityNumber}</p>
              <p><strong>Ngày sinh:</strong> {new Date(selectedProfile.dateOfBirth).toLocaleDateString()}</p>
              <p><strong>Giới tính:</strong> {selectedProfile.gender}</p>
              <p><strong>Chẩn đoán:</strong> {selectedProfile.diagnose || "Chưa có"}</p>
              <p><strong>Ghi chú:</strong> {selectedProfile.note || "Không có"}</p>
              <p><strong>Vấn đề:</strong> {selectedProfile.issues || "Không có"}</p>
              <p><strong>Bác sĩ:</strong> {selectedProfile.doctorId?.name || "Chưa có"}</p>
              <p><strong>Thuốc:</strong></p>
              <ul>
                {Array.isArray(selectedProfile.medicine) && selectedProfile.medicine.length > 0 ? (
                  selectedProfile.medicine.map((m, i) => (
                    <li key={i}>{m.name || m}</li>
                  ))
                ) : (
                  <li>Không có thuốc nào được ghi nhận</li>
                )}
              </ul>

              <p><strong>Dịch vụ:</strong></p>
              <ul>
                {Array.isArray(selectedProfile.service) && selectedProfile.service.length > 0 ? (
                  selectedProfile.service.map((s, i) => (
                    <li key={i}>{s.name || s}</li>
                  ))
                ) : (
                  <li>Không có dịch vụ nào được ghi lại</li>
                )}
              </ul>
            </>
          ) : (
            <p className="text-muted">Không có dữ liệu hồ sơ nào được tải.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpenProfileDialog(false)} className="rounded-pill px-4">
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AppointmentScheduleManagement;