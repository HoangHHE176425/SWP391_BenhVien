import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  notification,
  Drawer,
  Descriptions,
} from "antd";
import axios from "axios";
import moment from "moment";
import "../../assets/css/AdminPages.css";
const { Option } = Select;
const { RangePicker } = DatePicker;

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [roleFilter, setRoleFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/admin/employees");
      setEmployees(res.data);
    } catch (err) {
      message.error("Failed to fetch employees");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("/api/admin/getDepart");
      setDepartments(res.data);
    } catch (err) {
      message.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/delEmp/${id}`);
      message.success("Employee deleted");
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } catch (err) {
      message.error("Delete failed");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      ...employee,
      department: employee.department?._id || undefined,
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`/api/admin/updEmp/${editingEmployee._id}`, values);
      notification.success({ message: "Employee updated" });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      notification.error({ message: "Update failed" });
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await axios.post("/api/admin/createEmp", values);
      notification.success({ message: "Employee created" });
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchEmployees();
    } catch (err) {
      notification.error({ message: "Create failed" });
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchName = emp.name.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    const matchRole = roleFilter ? emp.role === roleFilter : true;
    const matchDate = dateRange
      ? new Date(emp.createdAt) >= dateRange[0] &&
        new Date(emp.createdAt) <= dateRange[1]
      : true;
    return matchName && matchStatus && matchRole && matchDate;
  });

  return (
    <div>
      <h1>Quản Lý Nhân Viên</h1>

      {/* Bộ lọc */}
      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <Input
          placeholder="Tìm kiếm theo tên"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Lọc theo vai trò"
          onChange={(value) => setRoleFilter(value)}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="Admin">Quản trị viên</Option>
          <Option value="Receptionist">Lễ tân</Option>
          <Option value="Doctor">Bác sĩ</Option>
        </Select>

        <Select
          placeholder="Trạng thái"
          onChange={(value) => setStatusFilter(value)}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="active">Đang hoạt động</Option>
          <Option value="inactive">Ngưng hoạt động</Option>
        </Select>

        <RangePicker
          onChange={(dates) => setDateRange(dates)}
          allowClear
          format="DD-MM-YYYY"
          placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
        />
        <Button
          onClick={() => {
            setSearchText("");
            setStatusFilter(null);
            setDateRange(null);
            setRoleFilter(null);
          }}
        >
          Đặt lại
        </Button>
        <Button
          type="primary"
          className="custom-add-button"
          onClick={() => setCreateModalVisible(true)}
        >
          Thêm Nhân Viên
        </Button>
      </div>

      {/* Bảng */}
      <Table
        dataSource={filteredEmployees}
        columns={[
          {
            title: "Tên",
            dataIndex: "name",
            render: (text, record) => (
              <Button type="link" onClick={() => setViewingEmployee(record)}>
                {text}
              </Button>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
          },
          { title: "Email", dataIndex: "email" },
          { title: "Vai trò", dataIndex: "role" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => (
              <Tag color={status === "active" ? "green" : "red"}>
                {status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
              </Tag>
            ),
          },
          {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (createdAt) => moment(createdAt).format("DD-MM-YYYY HH:mm"),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          },
          {
            title: "Hành động",
            render: (_, record) => (
              <Space>
                <Button onClick={() => handleEdit(record)}>Chỉnh sửa</Button>
                <Button danger onClick={() => handleDelete(record._id)}>
                  Xoá
                </Button>
              </Space>
            ),
          },
        ]}
        rowKey="_id"
      />

      {/* Chi tiết nhân viên */}
      <Drawer
        title="Chi Tiết Nhân Viên"
        open={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        width={400}
      >
        {viewingEmployee && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên">
              {viewingEmployee.name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {viewingEmployee.email}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              {viewingEmployee.role}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {viewingEmployee.status === "active"
                ? "Đang hoạt động"
                : "Ngưng hoạt động"}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng ban">
              {viewingEmployee?.department?.name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên môn">
              {viewingEmployee.specialization || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {viewingEmployee.phone || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {moment(viewingEmployee.createdAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* Modal chỉnh sửa */}
      <Modal
        title="Chỉnh Sửa Nhân Viên"
        open={!!editingEmployee}
        onCancel={() => setEditingEmployee(null)}
        onOk={handleEditSubmit}
        okText="Lưu"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
            <Select>
              <Option value="Admin">Quản trị viên</Option>
              <Option value="Receptionist">Lễ tân</Option>
              <Option value="Doctor">Bác sĩ</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="active">Đang hoạt động</Option>
              <Option value="inactive">Ngưng hoạt động</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Phòng ban"
            name="department"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn phòng ban">
              {departments.map((dept) => (
                <Option key={dept._id} value={dept._id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Chuyên môn" name="specialization">
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo mới */}
      <Modal
        title="Thêm Nhân Viên Mới"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="Tạo"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical">
          <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
            <Select>
              <Option value="Admin">Quản trị viên</Option>
              <Option value="Receptionist">Lễ tân</Option>
              <Option value="Doctor">Bác sĩ</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="active">Đang hoạt động</Option>
              <Option value="inactive">Ngưng hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EmployeeManagement;
