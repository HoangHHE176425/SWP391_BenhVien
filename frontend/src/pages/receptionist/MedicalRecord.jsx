import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  notification,
  Drawer,
  Descriptions,
  List,
} from "antd";
import axios from "axios";
import moment from "moment";
import "../../assets/css/AdminPages.css";
const { Option } = Select;
const { RangePicker } = DatePicker;

function MedicalRecord() {
  const [profiles, setProfiles] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [services, setServices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [genderFilter, setGenderFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  // Hàm kiểm tra số CMND/CCCD
  const validateIdentityNumber = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("Vui lòng nhập số CMND/CCCD!"));
    }
    const identityNumberRegex = /^[0-9]{12}$/;
    if (!identityNumberRegex.test(value)) {
      return Promise.reject(new Error("Số CMND/CCCD phải là 12 ký tự số, không chứa chữ, không khoảng trắng và không ký tự đặc biệt!"));
    }
    return Promise.resolve();
  };

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:9999/api/receptionist/profiles", config);
      const sortedProfiles = (res.data.data || []).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setProfiles(sortedProfiles);
    } catch (err) {
      message.error("Không thể tải hồ sơ bệnh nhân");
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:9999/api/receptionist/doctors", config);
      setDoctors(res.data.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách bác sĩ");
    }
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:9999/api/receptionist/medicines", config);
      setMedicines(res.data.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách thuốc");
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:9999/api/receptionist/services", config);
      setServices(res.data.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách dịch vụ");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "Receptionist") {
      message.error("Truy cập không được phép");
      window.location.href = "/";
      return;
    }
    fetchProfiles();
    fetchDoctors();
    fetchMedicines();
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:9999/api/receptionist/profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Đã xóa hồ sơ bệnh nhân");
      setProfiles((prev) => prev.filter((profile) => profile._id !== id));
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    form.setFieldsValue({
      name: profile.name,
      identityNumber: profile.identityNumber,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth ? moment(profile.dateOfBirth) : null,
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        identityNumber: values.identityNumber,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
      };
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:9999/api/receptionist/profiles/${editingProfile._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notification.success({ message: "Đã cập nhật hồ sơ bệnh nhân" });
      setEditingProfile(null);
      fetchProfiles();
    } catch (err) {
      notification.error({ message: "Cập nhật thất bại" });
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        name: values.name,
        identityNumber: values.identityNumber,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
      };
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:9999/api/receptionist/profiles", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notification.success({ message: "Đã tạo hồ sơ bệnh nhân" });
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchProfiles();
    } catch (err) {
      notification.error({ message: "Tạo hồ sơ thất bại" });
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchName = profile.name.toLowerCase().includes(searchText.toLowerCase()) ||
                     profile.identityNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchGender = genderFilter ? profile.gender === genderFilter : true;
    const matchDate = dateRange
      ? new Date(profile.createdAt) >= dateRange[0] &&
        new Date(profile.createdAt) <= dateRange[1]
      : true;
    return matchName && matchGender && matchDate;
  });

  return (
    <div>
      <h1>Quản Lý Bệnh Nhân</h1>
      {/* Filters */}
      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <Input
          placeholder="Tìm kiếm theo tên hoặc số CMND/CCCD"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Lọc theo giới tính"
          onChange={(value) => setGenderFilter(value)}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="Male">Nam</Option>
          <Option value="Female">Nữ</Option>
          <Option value="Other">Khác</Option>
        </Select>
        <RangePicker
          onChange={(dates) => setDateRange(dates)}
          allowClear
          format="YYYY-MM-DD"
        />
        <Button
          onClick={() => {
            setSearchText("");
            setGenderFilter(null);
            setDateRange(null);
          }}
        >
          Đặt Lại
        </Button>
        <Button
          type="primary"
          className="custom-add-button"
          onClick={() => setCreateModalVisible(true)}
        >
          Thêm Bệnh Nhân
        </Button>
      </div>

      {/* Table */}
      <Table
        dataSource={filteredProfiles}
        columns={[
          {
            title: "STT",
            render: (_, __, index) => index + 1,
            width: 70,
          },
          {
            title: "Tên Bệnh Nhân",
            dataIndex: "name",
            render: (text, record) => (
              <Button type="link" onClick={() => setViewingProfile(record)}>
                {text}
              </Button>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
          },
          { title: "Số CMND/CCCD", dataIndex: "identityNumber" },
          { title: "Giới Tính", dataIndex: "gender", render: (gender) => ({
              Male: "Nam",
              Female: "Nữ",
              Other: "Khác",
            }[gender] || gender)
          },
          {
            title: "Ngày Sinh",
            dataIndex: "dateOfBirth",
            render: (date) => moment(date).format("YYYY-MM-DD"),
            sorter: (a, b) => new Date(a.dateOfBirth) - new Date(b.dateOfBirth),
          },
          {
            title: "Hành Động",
            render: (_, record) => (
              <Space>
                <Button onClick={() => handleEdit(record)}>Sửa</Button>
                <Button danger onClick={() => handleDelete(record._id)}>
                  Xóa
                </Button>
              </Space>
            ),
          },
        ]}
        rowKey="_id"
      />

      {/* Patient Detail Drawer */}
      <Drawer
        title="Chi Tiết Bệnh Nhân"
        open={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
        width={400}
      >
        {viewingProfile && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên Bệnh Nhân">
              {viewingProfile.name}
            </Descriptions.Item>
            <Descriptions.Item label="Số CMND/CCCD">
              {viewingProfile.identityNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Giới Tính">
              {{
                Male: "Nam",
                Female: "Nữ",
                Other: "Khác",
              }[viewingProfile.gender] || viewingProfile.gender}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Sinh">
              {moment(viewingProfile.dateOfBirth).format("YYYY-MM-DD")}
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn Đoán">
              {viewingProfile.diagnose || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi Chú">
              {viewingProfile.note || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Vấn Đề">
              {viewingProfile.issues || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Bác Sĩ">
              {viewingProfile.doctor?.name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Thuốc">
              {viewingProfile.medicines?.length > 0 ? (
                <List
                  dataSource={viewingProfile.medicines}
                  renderItem={(item) => (
                    <List.Item>
                      {item.name} (Loại: {item.type}, Giá: {item.unitPrice})
                    </List.Item>
                  )}
                />
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch Vụ">
              {viewingProfile.services?.length > 0 ? (
                <List
                  dataSource={viewingProfile.services}
                  renderItem={(item) => (
                    <List.Item>
                      {item.name} (Giá: {item.price})
                    </List.Item>
                  )}
                />
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Xét Nghiệm">
              {viewingProfile.labTest ? (
                <>
                  Kết quả: {viewingProfile.labTest.result || "—"}<br />
                  Ngày: {viewingProfile.labTest.dayTest ? moment(viewingProfile.labTest.dayTest).format("YYYY-MM-DD") : "—"}
                </>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Tạo">
              {moment(viewingProfile.createdAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Cập Nhật">
              {moment(viewingProfile.updatedAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* Edit Patient Modal */}
      <Modal
        title="Sửa Hồ Sơ Bệnh Nhân"
        open={!!editingProfile}
        onCancel={() => setEditingProfile(null)}
        onOk={handleEditSubmit}
        okText="Lưu"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên Bệnh Nhân"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên bệnh nhân!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Số CMND/CCCD"
            name="identityNumber"
            rules={[
              { required: true, message: "Vui lòng nhập số CMND/CCCD!" },
              { validator: validateIdentityNumber },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Giới Tính"
            name="gender"
            rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
          >
            <Select>
              <Option value="Male">Nam</Option>
              <Option value="Female">Nữ</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Ngày Sinh"
            name="dateOfBirth"
            rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Patient Modal */}
      <Modal
        title="Thêm Bệnh Nhân Mới"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="Tạo"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="Tên Bệnh Nhân"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên bệnh nhân!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Số CMND/CCCD"
            name="identityNumber"
            rules={[
              { required: true, message: "Vui lòng nhập số CMND/CCCD!" },
              { validator: validateIdentityNumber },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Giới Tính"
            name="gender"
            rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
          >
            <Select>
              <Option value="Male">Nam</Option>
              <Option value="Female">Nữ</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Ngày Sinh"
            name="dateOfBirth"
            rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MedicalRecord;