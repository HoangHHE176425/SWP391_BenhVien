// File: UserMedicalProfileDetail.js
// --- BẮT ĐẦU CODE ---

import {
  Button,
  Form,
  Input,
  List,
  message,
  Pagination,
  Select,
  Spin,
  Tag,
  Typography
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import "../assets/css/UserMedicalProfile.css";
import Record from "../components/Record";

const { Title, Text } = Typography;
const { Option } = Select;

// Component con để hiển thị danh sách lựa chọn trong Modal
const ProfileSelectionList = ({ profiles, onSelect }) => (
  <List
    itemLayout="horizontal"
    dataSource={profiles}
    renderItem={(profile) => (
      <List.Item
        actions={[
          <Button type="primary" onClick={() => onSelect(profile)}>
            Chọn
          </Button>,
        ]}
      >
        <List.Item.Meta
          title={<Text strong>{profile.name}</Text>}
          description={`Ngày tháng năm sinh : ${dayjs(profile.dateOfBirth).format(
            "DD/MM/YYYY"
          )} - Giới tính : ${profile.gender}`}
        />
      </List.Item>
    )}
  />
);

const UserMedicalProfileDetail = () => {
  const [modalForm] = Form.useForm();

  // State quản lý UI chính
  const [identityToSearch, setIdentityToSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState("list"); // 'list', 'edit', hoặc 'appointments'
  const [foundProfiles, setFoundProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalSelectedAppointment, setModalSelectedAppointment] = useState(null);

  // State cho dữ liệu phụ (dịch vụ, thuốc)
  const [services, setServices] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isMedicineLoading, setIsMedicineLoading] = useState(false);
  const doctor = JSON.parse(localStorage.getItem("user"));
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State cho phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalPagination, setModalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // --- I. HÀM GỌI API ---

  // 1. Lấy danh sách dịch vụ
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:9999/api/services");
        if (!response.ok) throw new Error("Failed to fetch services");
        const data = await response.json();
        setServices(data);
      } catch (error) {
        message.error(error.message);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (doctor?._id) fetchAppointments(doctor._id, ['pending_clinical', 'waiting_for_doctor', 'pending_re-examination'], true, null, 1, 10);
  }, []);

  const fetchAppointments = async (doctorId, status, isToday = true, identifyNumber, page = 1, pageSize = 10) => {
    try {
      // Sử dụng URLSearchParams để tạo query string đúng format
      const params = new URLSearchParams();
      params.append('doctorId', doctorId);
      params.append('increaseSort', '1');
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      if (isToday) {
        const today = new Date();
        const dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        params.append('dateFrom', dateFrom.toISOString());
        params.append('dateTo', dateTo.toISOString());
      }

      if (status && Array.isArray(status)) {
        status.forEach(s => {
          params.append('status', s);
        });
      }

      if (identifyNumber) {
        params.append('identityNumber', identifyNumber);
      }
      
      const res = await axios.get(`/api/apm/appointments/aggregate?${params.toString()}`);
      
      // Nếu đang trong modal search, lưu vào state riêng
      if (!isToday && status === false) {
        setFoundProfiles(res.data.data);
        // Cập nhật phân trang cho modal
        setModalPagination(prev => ({
          ...prev,
          current: page,
          total: res.data.total
        }));
      } else {
        setAppointments(res.data.data);
        // Cập nhật phân trang cho danh sách chính
        setPagination(prev => ({
          ...prev,
          current: page,
          total: res.data.total // Tạm thời tính total dựa trên data hiện tại
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tìm kiếm hồ sơ và mở popup lựa chọn
  const handleSearchAndShowSelection = async () => {
    if (!identityToSearch.trim()) {
      message.warn("Nhập căn cước công dân hoặc chứng minh nhân để tìm hồ sơ bệnh nhân.");
      return;
    }
    setIsSearching(true);
    try {
      // Sử dụng fetchAppointments với isToday = false và status = false
      await fetchAppointments(doctor._id, false, false, identityToSearch, 1, 10);
      setModalView("appointments"); // Đặt chế độ xem là danh sách lịch hẹn
      setIsModalOpen(true); // Mở Modal
    } catch (error) {
      console.error("Lỗi khi tìm lịch hẹn:", error);
      message.error("Xảy ra lỗi khi tìm lịch hẹn.");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Tìm kiếm thuốc
  const handleMedicineSearch = async (searchText) => {
    if (searchText && searchText.length > 0) {
      setIsMedicineLoading(true);
      try {
        const response = await fetch(
          `http://localhost:9999/api/medicines?search=${searchText}`
        );
        const data = await response.json();

        // Lọc client-side để đảm bảo chỉ hiển thị thuốc bắt đầu bằng từ khóa
        const filtered = data.filter((med) =>
          med.name.toLowerCase().startsWith(searchText.toLowerCase())
        );

        setMedicines(filtered);
      } catch (error) {
        console.error(error);
        setMedicines([]);
      } finally {
        setIsMedicineLoading(false);
      }
    } else {
      setMedicines([]);
    }
  };

  // 4. Gửi dữ liệu cập nhật
  const handleUpdateProfile = async (values) => {
    setIsUpdating(true);
    try {
      const doctor = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(
        `http://localhost:9999/api/doctor/${selectedProfile._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, doctorId: doctor._id }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật hồ sơ.");
      }
      message.success("Hồ sơ được cập nhật thành công!");
      handleCloseModal(); // Đóng và reset mọi thứ
    } catch (error) {
      message.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- II. HÀM XỬ LÝ GIAO DIỆN ---

  // Chuyển từ màn hình danh sách sang màn hình chỉnh sửa
  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    modalForm.setFieldsValue({
      service: profile.service || [],
      diagnose: profile.diagnose || "",
      note: profile.note || "",
      issues: profile.issues || "",
      medicine: (profile.medicine || []).map((m) =>
        typeof m === "object" ? m.name : m
      ),
      dayTest:
        profile.labTestId != null && profile.labTestId.dayTest != null
          ? dayjs(profile.labTestId.dayTest)
          : dayjs(),
      result:
        profile.labTestId != null && profile.labTestId.result != null
          ? profile.labTestId.result
          : "",
    });
    setModalView("edit"); // Chuyển sang chế độ chỉnh sửa
  };

  // Quay lại màn hình danh sách từ màn hình chỉnh sửa
  const handleBackToList = () => {
    setSelectedProfile(null);
    modalForm.resetFields();
    setModalView("list");
  };

  // Đóng và reset hoàn toàn modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFoundProfiles([]);
    setSelectedProfile(null);
    setModalSelectedAppointment(null);
    modalForm.resetFields();
    // Không reset identityToSearch để người dùng có thể thấy số họ vừa tìm
  };

  // Xử lý chọn appointment trong modal
  const handleModalSelectAppointment = (appointment) => {
    setModalSelectedAppointment(appointment);
  };

  // Xử lý lưu phiếu khám trong modal
  const handleModalSaveMedicalRecord = async (values) => {
    try {
      await axios.post(`/api/record`, {
        ...values,
        appointmentId: modalSelectedAppointment._id,
        doctorId: doctor._id,
        profileId: modalSelectedAppointment.profileId._id,
      });
      message.success("Phiếu khám đã được lưu thành công!");
      await fetchAppointments(doctor._id, false, false, identityToSearch, modalPagination.current, modalPagination.pageSize);
      setModalSelectedAppointment(null);
    } catch (error) {
      console.error("Lỗi khi lưu phiếu khám:", error);
      message.error("Có lỗi xảy ra khi lưu phiếu khám!");
    }
  };

  const handleModalUpdateRecord = async (values) => {
    try {
      await axios.put(`/api/record/${values._id}`, values);
      await fetchAppointments(doctor._id, false, false, identityToSearch, modalPagination.current, modalPagination.pageSize);
      message.success("Phiếu khám đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu khám:", error);
      message.error("Có lỗi xảy ra khi cập nhật phiếu khám!");
    }
  };

  const handleModalResetTree = () => {
    setModalSelectedAppointment(null);
    fetchAppointments(doctor._id, false, false, identityToSearch, modalPagination.current, modalPagination.pageSize);
  };

  // Xử lý phân trang cho danh sách chính
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchAppointments(doctor._id, ['pending_clinical', 'waiting_for_doctor', 'pending_re-examination'], true, null, page, pageSize);
  };

  // Xử lý phân trang cho modal
  const handleModalPageChange = (page, pageSize) => {
    setModalPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchAppointments(doctor._id, false, false, identityToSearch, page, pageSize);
  };

  // Xử lý chọn appointment từ danh sách chờ
  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
  };

  // Xử lý lưu phiếu khám
  const handleSaveMedicalRecord = async (values) => {
    try {
      await axios.post(`/api/record`, {
        ...values,
        appointmentId: selectedAppointment._id,
        doctorId: doctor._id,
        profileId: selectedAppointment.profileId._id,
      });
      message.success("Phiếu khám đã được lưu thành công!");
      await fetchAppointments(doctor._id, ['pending_clinical', 'waiting_for_doctor', 'pending_re-examination'], true, null, pagination.current, pagination.pageSize);
      // setSelectedAppointment(null);
    } catch (error) {
      console.error("Lỗi khi lưu phiếu khám:", error);
      message.error("Có lỗi xảy ra khi lưu phiếu khám!");
    }
  };

  const handleUpdateRecord = async (values) => {
    try {
      await axios.put(`/api/record/${values._id}`, values);
      await fetchAppointments(doctor._id, ['pending_clinical', 'waiting_for_doctor', 'pending_re-examination'], true, null, pagination.current, pagination.pageSize);
      message.success("Phiếu khám đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu khám:", error);
      message.error("Có lỗi xảy ra khi cập nhật phiếu khám!");
    }
  };

  const handleRestTree = () => {
    setSelectedAppointment(null);
    fetchAppointments(doctor._id, ['pending_clinical', 'waiting_for_doctor', 'pending_re-examination'], true, null, pagination.current, pagination.pageSize);
  }

  // --- III. RENDER COMPONENT ---

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "auto" }}>
      <Title level={3}>Tìm hồ sơ y tế</Title>

      <Form
        layout="inline"
        onFinish={handleSearchAndShowSelection}
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        <Form.Item
          name="identity"
          validateTrigger="onSubmit"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số CMND/CCCD!",
            },
            {
              pattern: /^\d{12}$/,
              message:
                "Số CMND/CCCD phải là 12 ký tự số, không chứa chữ, không khoảng trắng và không ký tự đặc biệt!",
            },
          ]}
          style={{ flex: 1 }}
        >
          <Input
            placeholder="Nhập số CMND/CCCD (12 chữ số)"
            allowClear
            onChange={(e) => setIdentityToSearch(e.target.value)}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSearching}
          >
            Tìm hồ sơ
          </Button>
        </Form.Item>
      </Form>

      {/* Khung danh sách chờ */}
      <div className="flex gap-10">
      <div className="khung-ds-cho w-1/3">
        <Title level={4}>Danh sách chờ khám</Title>
        {loading ? <div className="appointment-list">
          <Spin />
        </div> : <div className="appointment-list max-h-[400px] overflow-y-auto">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment._id}
                className={`appointment-item ${selectedAppointment?._id === appointment._id ? 'selected' : ''}`}
                onClick={() => handleSelectAppointment(appointment)}
              >
                <div className="appointment-header">
                  <div className="appointment-time">
                    {dayjs(appointment.appointmentDate).format('DD/MM/YYYY HH:mm')}
                  </div>
                  <Tag
                    className={`appointment-status ${
                      appointment.status === 'pending_clinical' ? 'status-pending' : 'status-booked'
                    }`}
                  >
                    {appointment.status === 'pending_clinical' ? 'Chờ xét nghiệm' : appointment.status === 'pending_re-examination' ? 'Chờ tái khám' : 'Chờ khám'}
                  </Tag>
                </div>
                <div className="appointment-info">
                  <div>
                    <span>Bệnh nhân:</span> <strong>{appointment.profileId?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Loại khám:</span> <strong>{appointment.type}</strong>
                  </div>
                  <div>
                    <span>Triệu chứng:</span> <strong>{appointment.symptoms || 'Không có'}</strong>
                  </div>
                  <div>
                    <span>Phòng:</span> <strong>{appointment.room || 'Chưa phân công'}</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Không có lịch hẹn nào trong danh sách chờ
            </div>
          )}
        </div>}
        
        {/* Phân trang cho danh sách chính */}
        {appointments.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Component Record */}
      <Record 
        selectedAppointment={selectedAppointment}
        onSaveRecord={handleSaveMedicalRecord}
        onUpdateRecord={handleUpdateRecord}
        handleRestTree={handleRestTree}
      />
      </div>
    </div>
  );
};

export default UserMedicalProfileDetail;
// --- KẾT THÚC CODE ---
