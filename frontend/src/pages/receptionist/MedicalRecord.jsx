import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Modal, Spin, message, Form, Input, Select, Space } from "antd";
import dayjs from "dayjs";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from "../../context/authContext";


const MedicalRecord = () => {
  const [profiles, setProfiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); // Modal chỉnh sửa
  const [showRecordModal, setShowRecordModal] = useState(false); // Modal records
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "Male",
    identityNumber: "",
    phone: ""
  });
  const { token } = useAuth();

  // Hàm chuyển đổi status sang tiếng Việt
  const formatStatus = (status) => {
    const statusMap = {
      'pending_clinical': 'Đang chờ khám',
      'pending_re-examination': 'Đang chờ tái khám',
      'done': 'Đã xong'
    };
    return statusMap[status] || 'Chưa có';
  };

  // Tải tất cả hồ sơ khi component được mount
  useEffect(() => {
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    console.log("fetchAllProfiles called with Token:", token);

    if (!token) {
      console.error("No token found, please log in again.");
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/api/profile/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Full API response:", res.data);

      if (Array.isArray(res.data.profiles)) {
        console.log("Profiles found, updating state:", res.data.profiles);
        setProfiles(res.data.profiles);
      } else {
        console.log("No profiles found in response or invalid data format.");
        setProfiles([]);
      }
    } catch (err) {
      console.error("Failed to fetch profiles:", err.response?.data || err.message);
      setError("Không tải được danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  // Load records by profileId
  const fetchRecordsByProfileId = async (profileId) => {
    console.log("fetchRecordsByProfileId called with profileId:", profileId);

    if (!token) {
      console.error("No token found, please log in again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9999/api/profile/record/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Records API response:", res.data);

      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setRecords(res.data.data);
        console.log("Processed records:", res.data.data);
      } else {
        setRecords([]);
        console.log("No records data found or data is empty.");
      }
    } catch (err) {
      console.error("Failed to fetch records:", err.response?.data || err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate name (không chứa số)
  const validateName = (name) => {
    const regex = /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]+$/;
    return regex.test(name);
  };

  // Validate identityNumber
  const validateIdentityNumber = (identityNumber) => {
    const regex = /^\d{12}$/;
    return regex.test(identityNumber);
  };

  // Validate phone
  const validatePhone = (phone) => {
    const regex = /^0\d{9}$/;
    return regex.test(phone);
  };

  // Update profile
  const handleSubmit = async () => {
    console.log("handleSubmit called with formData:", formData);

    if (!token) {
      console.error("No token found, please log in again.");
      return;
    }

    if (!validateName(formData.name)) {
      message.error("Tên không được chứa số, chỉ chấp nhận chữ cái và khoảng trắng.");
      return;
    }

    if (!validateIdentityNumber(formData.identityNumber)) {
      message.error("CMND/CCCD phải là 12 ký tự số, không khoảng trắng, chữ hoặc ký tự đặc biệt.");
      return;
    }

    if (!validatePhone(formData.phone)) {
      message.error("Số điện thoại phải là 10 chữ số, bắt đầu bằng 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`http://localhost:9999/api/profile/update/${editingProfile._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Update API response:", res.data);
      setShowEditModal(false);
      setEditingProfile(null);
      setFormData({ name: "", dateOfBirth: "", gender: "Male", identityNumber: "", phone: "" });
      fetchAllProfiles();
      message.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      console.error("Error updating profile:", err.response?.data || err.message);
      message.error(err.response?.data?.message || "Lỗi khi cập nhật hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const openEditModal = (profile) => {
    console.log("openEditModal called with profile:", profile);
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth.split("T")[0],
      gender: profile.gender,
      identityNumber: profile.identityNumber,
      phone: profile.phone || ""
    });
    setShowEditModal(true);
  };

  // View records
  const handleViewRecords = async (profile) => {
    await fetchRecordsByProfileId(profile._id);
    setEditingProfile(profile);
    setShowRecordModal(true);
  };

  const profileColumns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'CMND/CCCD',
      dataIndex: 'identityNumber',
      key: 'identityNumber',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEditModal(record)}>
            Sửa
          </Button>
          <Button type="link" onClick={() => handleViewRecords(record)}>
            Xem Records
          </Button>
        </Space>
      ),
    },
  ];

  const recordColumns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Bác sĩ',
      render: (record) => record.doctorId?.name || 'Chưa có',
    },
    {
      title: 'Lịch hẹn',
      render: (record) => record.appointmentId?.appointmentDate ? dayjs(record.appointmentId.appointmentDate).format('DD/MM/YYYY') : 'Chưa có',
    },
    {
      title: 'Ngày nhập viện',
      render: (record) => record.admissionDate ? dayjs(record.admissionDate).format('DD/MM/YYYY') : 'Chưa có',
    },
    {
      title: 'Chẩn đoán nhập viện',
      dataIndex: 'admissionDiagnosis',
      render: (text) => text || 'Chưa có',
    },
    {
      title: 'Chẩn đoán ra viện',
      dataIndex: 'dischargeDiagnosis',
      render: (text) => text || 'Chưa có',
    },
    {
      title: 'Trạng thái',
      render: (record) => formatStatus(record.status),
    },
    {
      title: 'Tóm tắt điều trị',
      dataIndex: 'treatmentSummary',
      render: (text) => text || 'Chưa có',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ textAlign: 'center', marginBottom: 16 }}>Danh Sách Hồ Sơ Bệnh Án</h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'red' }}>
          <h5>{error}</h5>
          <Button type="primary" onClick={fetchAllProfiles}>
            Thử lại
          </Button>
        </div>
      ) : profiles.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Không có hồ sơ nào.</p>
      ) : (
        <Table
          rowKey="_id"
          dataSource={profiles}
          columns={profileColumns}
          pagination={false}
        />
      )}

      {/* Modal xem records */}
      <Modal
        title={
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setShowRecordModal(false)}
              style={{ marginRight: 8 }}
            />
            Records của {editingProfile?.name || 'Hồ sơ'}
          </div>
        }
        open={showRecordModal}
        onCancel={() => setShowRecordModal(false)}
        footer={null}
        width={1000}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'red' }}>
            <h5>{error}</h5>
            <Button type="primary" onClick={() => fetchRecordsByProfileId(editingProfile?._id)}>
              Thử lại
            </Button>
          </div>
        ) : records.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Không có records nào.</p>
        ) : (
          <Table
            rowKey="_id"
            dataSource={records}
            columns={recordColumns}
            pagination={false}
          />
        )}
      </Modal>

      {/* Modal chỉnh sửa */}
      <Modal
        title="Cập nhật hồ sơ"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingProfile(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowEditModal(false);
            setEditingProfile(null);
          }}>
            Huỷ
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
            Lưu thay đổi
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Tên">
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item label="Ngày sinh">
            <Input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={dayjs().format('YYYY-MM-DD')}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item label="Giới tính">
            <Select
              name="gender"
              value={formData.gender}
              onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              disabled={loading}
            >
              <Option value="Male">Nam</Option>
              <Option value="Female">Nữ</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Số điện thoại">
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              disabled={loading}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


export default MedicalRecord;
