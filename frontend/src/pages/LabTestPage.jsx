// File: UserMedicalProfileDetail.js
// --- BẮT ĐẦU CODE ---

import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  List,
  message,
  Modal,
  Select, // Sử dụng List để hiển thị danh sách gọn gàng hơn
  Space,
  Spin,
  Tag,
  Typography
} from "antd"
import axios from "axios"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import "../assets/css/LabTestPage.css"

const { Title, Text } = Typography
const { Option } = Select

// Component con để hiển thị danh sách lựa chọn trong Modal
const ProfileSelectionList = ({ profiles, onSelect }) => (
  <List
    itemLayout="horizontal"
    dataSource={profiles}
    renderItem={(profile) => (
      <List.Item
        actions={[
          <Button type="primary" onClick={() => onSelect(profile)}>
            Select
          </Button>,
        ]}>
        <List.Item.Meta
          title={<Text strong>{profile.name}</Text>}
          description={`Ngày tháng năm sinh : ${dayjs(profile.dateOfBirth).format(
            "DD/MM/YYYY"
          )} - Giới tính : ${profile.gender}`}
        />
      </List.Item>
    )}
  />
)

const UserMedicalProfileDetail = () => {
  const [modalForm] = Form.useForm()
  const [labTestForm] = Form.useForm()

  // State quản lý UI chính
  const [identityToSearch, setIdentityToSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalView, setModalView] = useState("list") // 'list' hoặc 'edit'
  const [foundProfiles, setFoundProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // State cho dữ liệu phụ (dịch vụ, thuốc)
  const [services, setServices] = useState([])
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSavingLabTest, setIsSavingLabTest] = useState(false)
  
  // Lấy thông tin bác sĩ từ localStorage
  const doctor = JSON.parse(localStorage.getItem("user"));

  // --- I. HÀM GỌI API ---

  // 1. Lấy danh sách dịch vụ
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:9999/api/services")
        if (!response.ok) throw new Error("Failed to fetch services")
        const data = await response.json()
        setServices(data)
      } catch (error) {
        message.error(error.message)
      }
    }
    fetchServices()
  }, [])

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const fetchRecords = async () => {
    if (!doctor || !doctor._id) {
      console.log("Không tìm thấy thông tin bác sĩ");
      return;
    }
    
    try {
      const res = await axios.get(`/api/record`, {
        params: {
          status: 'pending_clinical',
          docterAct: doctor._id
        }
      });
      console.log(res.data);
      setRecords(res.data.data || []);
    } catch ( err) {
      console.log(err);
    } finally {
      setLoading(false)
    }
  }

  // 2. Tìm kiếm hồ sơ và mở popup lựa chọn
  const handleSearchAndShowSelection = async () => {
    if (!identityToSearch.trim()) {
      message.warn("Hãy nhập CCCD/CMND của bệnh nhân.")
      return
    }
    setIsSearching(true)
    try {
      const response = await fetch(
        `http://localhost:9999/api/doctor/by-identity/${identityToSearch}`
      )
      if (!response.ok && response.status !== 404) {
        throw new Error("An error occurred while searching for profiles.")
      }
      const result = await response.json()
      const profilesData = result.data || []

      if (profilesData.length === 0) {
        message.info("No profiles found for this identity number.")
      } else {
        setFoundProfiles(profilesData)
        setModalView("list") // Đặt chế độ xem là danh sách
        setIsModalOpen(true) // Mở Modal
      }
    } catch (error) {
      message.error(error.message)
    } finally {
      setIsSearching(false)
    }
  }

  // 4. Gửi dữ liệu cập nhật
  const handleUpdateProfile = async (values) => {
    if (!doctor || !doctor._id) {
      message.error("Không tìm thấy thông tin bác sĩ");
      return;
    }
    
    setIsUpdating(true)
    try {
      const response = await fetch(
        `http://localhost:9999/api/doctor/${selectedProfile._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, doctorId: doctor._id }),
        }
      )
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update profile.")
      }
      message.success("Profile updated successfully!")
      handleCloseModal() // Đóng và reset mọi thứ
    } catch (error) {
      message.error(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Xử lý chọn record từ danh sách
  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    labTestForm.setFieldsValue({
      admissionLabTest: record.admissionLabTest || ""
    });
  };

  // Xử lý lưu kết quả xét nghiệm
  const handleSaveLabTest = async (values) => {
    if (!selectedRecord) {
      message.error("Vui lòng chọn một record để cập nhật");
      return;
    }

    setIsSavingLabTest(true);
    try {
      await axios.put(`/api/record/${selectedRecord._id}`, {
        ...selectedRecord,
        admissionLabTest: values.admissionLabTest,
        status: 'pending_re-examination'
      });
      message.success("Kết quả xét nghiệm đã được cập nhật thành công!");
      await fetchRecords(); // Refresh danh sách
      setSelectedRecord(null);
      labTestForm.resetFields();
    } catch (error) {
      console.error("Lỗi khi cập nhật kết quả xét nghiệm:", error);
      message.error("Có lỗi xảy ra khi cập nhật kết quả xét nghiệm!");
    } finally {
      setIsSavingLabTest(false);
    }
  };

  // --- II. HÀM XỬ LÝ GIAO DIỆN ---

  // Chuyển từ màn hình danh sách sang màn hình chỉnh sửa
  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile)
    modalForm.setFieldsValue({
      doctorName: profile?.doctorId?.name || "",
      service: profile.service || [],
      diagnose: profile.diagnose || "",
      note: profile.note || "",
      issues: profile.issues || "",
      medicine: profile.medicine || [],
      dayTest: profile.labTestId?.dayTest ? dayjs(profile.labTestId.dayTest) : null,
      result: profile.labTestId?.result || ""
    })

    setModalView("edit") // Chuyển sang chế độ chỉnh sửa
  }

  // Quay lại màn hình danh sách từ màn hình chỉnh sửa
  const handleBackToList = () => {
    setSelectedProfile(null)
    modalForm.resetFields()
    setModalView("list")
  }

  // Đóng và reset hoàn toàn modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFoundProfiles([])
    setSelectedProfile(null)
    modalForm.resetFields()
    // Không reset identityToSearch để người dùng có thể thấy số họ vừa tìm
  }

  // --- III. RENDER COMPONENT ---

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "auto" }}>
      <Title level={3}>Quản lý xét nghiệm</Title>

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
                Quay lại danh sách
              </Button>,
              <Button key="cancelEdit" onClick={handleCloseModal}>
                Đóng
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={isUpdating}
                onClick={() => modalForm.submit()}>
                Cập nhật hồ sơ
              </Button>,
            ]
        }>
        {modalView === "list" ? (
          <ProfileSelectionList
            profiles={foundProfiles}
            onSelect={handleProfileSelect}
          />
        ) : (
          <Form
            form={modalForm}
            layout="vertical"
            onFinish={handleUpdateProfile}>
            <Form.Item name="doctorName" label="Bác sĩ">
              <Input.TextArea
                rows={1}
                disabled
              />
            </Form.Item>
            <Form.Item
              name="service"
              label="1. Dịch vụ khám bệnh"
              rules={[
                {
                  required: true,
                  message: "Please select at least one service.",
                },
              ]}>
              <Checkbox.Group>
                <Space direction="vertical">
                  {services.map((s) => (
                    <Checkbox key={s._id} value={s._id}
                      disabled={true}
                    >
                      {s.name} - ${s.price}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
            <Form.Item name="result" label="2. Kết quả khám bệnh">
              <Input.TextArea
                rows={2}
                placeholder="Nhập kết quả khám bệnh..."
              />
            </Form.Item>
            <Form.Item name="dayTest" label="3. Ngày khám bệnh">
              <DatePicker defaultValue={dayjs('01/01/2015', 'DD/MM/YYYY')} />
            </Form.Item>

          </Form>
        )}
      </Modal>

      {/* Khung danh sách chờ và form xét nghiệm */}
      <div className="flex gap-10">
        {/* Danh sách chờ xét nghiệm */}
        <div className="khung-ds-cho max-h-[500px] overflow-y-auto w-1/3">
          <Title level={4}>Danh sách chờ xét nghiệm</Title>
          {loading ? <div className="appointment-list">
            <Spin />
          </div> : <div className="appointment-list">
            {records?.length > 0 ? (
              records?.map((record) => (
                <div
                  key={record?._id}
                  className={`appointment-item ${selectedRecord?._id === record?._id ? 'selected' : ''}`}
                  onClick={() => handleSelectRecord(record)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="appointment-header">
                    <div className="appointment-time">
                      {dayjs(record?.createdAt).format('DD/MM/YYYY HH:mm')}
                    </div>
                    <Tag
                      className={`appointment-status ${
                        record?.status === 'pending_clinical' ? 'status-pending' : 'status-booked'
                      }`}
                    >
                      {record?.status === 'pending_clinical' ? 'Chờ xét nghiệm' : ''}
                    </Tag>
                  </div>
                  <div className="appointment-info">
                    <div>
                      <span>Bệnh nhân:</span> <strong>{record?.profileId?.name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span>Dịch vụ:</span> <strong>{record?.services?.map((service) => service?.name).join(', ')}</strong>
                    </div>
                    <div>
                      <span>Chẩn đoán:</span> <strong>{record?.admissionDiagnosis || 'Chưa có'}</strong>
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

        {/* Form cập nhật kết quả xét nghiệm */}
        <div className="khung-form-xet-nghiem w-2/3">
          <Title level={4}>Cập nhật kết quả xét nghiệm</Title>
          {selectedRecord ? (
            <div style={{ padding: '20px', border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Bệnh nhân: {selectedRecord.profileId?.name}</Text>
                <br />
                <Text type="secondary">Ngày tạo: {dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
              
              <Form
                form={labTestForm}
                layout="vertical"
                onFinish={handleSaveLabTest}
              >
                <Form.Item 
                  name="admissionLabTest" 
                  label="Kết quả xét nghiệm"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập chẩn đoán!",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Nhập chẩn đoán"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSavingLabTest}
                    size="large"
                  >
                    Cập nhật kết quả xét nghiệm
                  </Button>
                </Form.Item>
              </Form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px', border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              Vui lòng chọn một bệnh nhân từ danh sách để cập nhật kết quả xét nghiệm
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserMedicalProfileDetail
// --- KẾT THÚC CODE ---
