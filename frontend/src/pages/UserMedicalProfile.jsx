// File: UserMedicalProfileDetail.js
// --- BẮT ĐẦU CODE ---

import {
  Button,
  Form,
  Input,
  List,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
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
  const [modalView, setModalView] = useState("list"); // 'list' hoặc 'edit'
  const [foundProfiles, setFoundProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // State cho dữ liệu phụ (dịch vụ, thuốc)
  const [services, setServices] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isMedicineLoading, setIsMedicineLoading] = useState(false);
  const doctor = JSON.parse(localStorage.getItem("user"));
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (doctor?._id) fetchAppointments(doctor._id);
  }, []);

  const fetchAppointments = async (doctorId) => {
    try {
      const res = await axios.get(`/api/appointments`, {
        params: { doctorId, status: ['pending_clinical', 'waiting_for_doctor'], increaseSort: 1 },
      });
      setAppointments(res.data);
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
      const response = await fetch(
        `http://localhost:9999/api/doctor/by-identity/${identityToSearch}`
      );
      if (!response.ok && response.status !== 404) {
        throw new Error("Xảy ra lỗi khi tìm hồ sơ.");
      }
      const result = await response.json();
      const profilesData = result.data || [];

      if (profilesData.length === 0) {
        message.info("Không có hồ sơ cho CCCD/CMND này.");
      } else {
        setFoundProfiles(profilesData);
        setModalView("list"); // Đặt chế độ xem là danh sách
        setIsModalOpen(true); // Mở Modal
      }
    } catch (error) {
      message.error(error.message);
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
    modalForm.resetFields();
    // Không reset identityToSearch để người dùng có thể thấy số họ vừa tìm
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
      await fetchAppointments(doctor._id, 'waiting_for_doctor');
      // setSelectedAppointment(null);
    } catch (error) {
      console.error("Lỗi khi lưu phiếu khám:", error);
      message.error("Có lỗi xảy ra khi lưu phiếu khám!");
    }
  };

  const handleUpdateRecord = async (values) => {
    try {
      await axios.put(`/api/record/${values._id}`, values);
      await fetchAppointments(doctor._id, 'waiting_for_doctor');
      message.success("Phiếu khám đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu khám:", error);
      message.error("Có lỗi xảy ra khi cập nhật phiếu khám!");
    }
  };

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
      <div className="khung-ds-cho max-h-[500px] overflow-y-auto w-1/3">
        <Title level={4}>Danh sách chờ khám</Title>
        {loading ? <div className="appointment-list">
          <Spin />
        </div> : <div className="appointment-list">
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
                    {appointment.status === 'pending_clinical' ? 'Chờ xét nghiệm' : 'Chờ khám'}
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
      </div>

      {/* Component Record */}
      <Record 
        selectedAppointment={selectedAppointment}
        onSaveRecord={handleSaveMedicalRecord}
        onUpdateRecord={handleUpdateRecord}
      />
      </div>



      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        width={modalView === "list" ? 600 : 800}
        title={
          modalView === "list"
            ? "Chọn 1 hồ sơ"
            : `Chỉnh sửa hồ sơ: ${selectedProfile?.name}`
        }
        footer={
          modalView === "list"
            ? [
              <Button key="cancelList" onClick={handleCloseModal}>
                Đóng
              </Button>,
            ]
            : [
              <Button key="back" onClick={handleBackToList}>
                Quay lại danh sách hồ sơ
              </Button>,
              <Button key="cancelEdit" onClick={handleCloseModal}>
                Đóng
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={isUpdating}
                onClick={() => modalForm.submit()}
              >
                Cập nhật hồ sơ
              </Button>,
            ]
        }
      >
        {modalView === "list" ? (
          <ProfileSelectionList
            profiles={foundProfiles}
            onSelect={handleProfileSelect}
          />
        ) : (
          <Form
            form={modalForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
          >
            <Form.Item
              name="service"
              label="1. Dịch vụ khám bệnh"
              rules={[
                {
                  required: true,
                  message: "Chọn ít nhất 1 dịch vụ khám.",
                },
              ]}
            >
              <Checkbox.Group>
                <Space direction="vertical">
                  {services.map((s) => (
                    <Checkbox key={s._id} value={s._id}>
                      {s.name} - ${s.price}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
            <Form.Item name="diagnose" label="2. Chẩn đoán">
              <Input.TextArea
                rows={4}
                placeholder="Nhập chi tiết chẩn đoán..."
              />
            </Form.Item>
            <Form.Item name="note" label="3. Ghi chú của bác sĩ">
              <Input.TextArea
                rows={2}
                placeholder="Nhập ghi chú..."
              />
            </Form.Item>
            <Form.Item name="issues" label="4. Các triệu chứng của bệnh nhân">
              <Input.TextArea
                rows={2}
                placeholder="Mô tả các triệu chứng và vấn đề bệnh nhân gặp phải..."
              />
            </Form.Item>
            <Form.Item name="medicine" label="5. Kê thuốc">
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Tìm và chọn thuốc..."
                onSearch={handleMedicineSearch}
                loading={isMedicineLoading}
                filterOption={false}
                notFoundContent={
                  isMedicineLoading ? <Spin size="small" /> : null
                }
              >
                {medicines.map((med) => (
                  <Option key={med._id} value={med._id}>
                    {med.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="result" label="4. Kết quả xét nghiệm">
              <Input.TextArea
                rows={2}
                placeholder="Nhập kết quả xét nghiệm..."
                disabled
              />
            </Form.Item>
            <Form.Item name="dayTest" label="5. Ngày xét nghiệm">
              <DatePicker
                defaultValue={dayjs("01/01/2015", "DD/MM/YYYY")}
                disabled
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default UserMedicalProfileDetail;
// --- KẾT THÚC CODE ---
