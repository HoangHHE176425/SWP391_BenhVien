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
import { Switch } from "antd";

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
  const [logDrawerVisible, setLogDrawerVisible] = useState(false);
  const [employeeLogs, setEmployeeLogs] = useState([]);
  const [logEmployee, setLogEmployee] = useState(null);

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
  const getDepartmentNameById = (id) => {
    const found = departments.find(dep => dep._id === id);
    return found ? found.name || found.departmentCode : id; // fallback là ID nếu không tìm thấy
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      ...employee,
      department: employee.department?._id || undefined,
    });
  };
  const toggleStatus = async (record) => {
    try {
      const updatedStatus = record.status === "active" ? "inactive" : "active";
      await axios.put(`/api/admin/updEmp/${record._id}`, {
        status: updatedStatus,
      });
      message.success("Trạng thái đã được cập nhật");
      fetchEmployees(); // cập nhật lại bảng
    } catch (err) {
      message.error("Không thể đổi trạng thái");
    }
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
  const fetchEmployeeLogs = async (employee) => {
    try {
      const res = await axios.get(`/api/admin/employee-log/${employee._id}`);
      setEmployeeLogs(res.data);
      setLogEmployee(employee);
      setLogDrawerVisible(true);
    } catch (err) {
      message.error("Không thể tải lịch sử log");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const keyword = searchText.toLowerCase();
    const matchNameOrCode =
      emp.name.toLowerCase().includes(keyword) ||
      emp.employeeCode?.toLowerCase().includes(keyword);

    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    const matchRole = roleFilter ? emp.role === roleFilter : true;
    const matchDate = dateRange
      ? new Date(emp.createdAt) >= dateRange[0] &&
        new Date(emp.createdAt) <= dateRange[1]
      : true;
    return matchNameOrCode && matchStatus && matchRole && matchDate;
  });

  return (
    <div>
      <h1>Quản Lý Nhân Viên</h1>
      {/* Bộ lọc */}
      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <Input
          placeholder="Tìm theo tên hoặc mã nhân viên"
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
          <Option value="HRManager">Quản lý nhân viên</Option>
          <Option value="Pharmacist">Dược sĩ</Option>
          <Option value="Accountant">Kế toán</Option>
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
            title: "Mã",
            dataIndex: "employeeCode",
            render: (text, record) => (
              <Button type="link" onClick={() => setViewingEmployee(record)}>
                {text}
              </Button>
            ),
            sorter: (a, b) => a.name.localeCompare(b.employeeCode),
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
              <Switch
                checked={record.status === "active"}
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
                onChange={() => toggleStatus(record)}
              />
              <Button type="link" onClick={() => fetchEmployeeLogs(record)}>Xem log</Button>
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
          <Option value="HRManager">Quản lý nhân viên</Option>
          <Option value="Pharmacist">Dược sĩ</Option>
          <Option value="Accountant">Kế toán</Option>
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
  destroyOnClose
>
  <Form form={createForm} layout="vertical">
    <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Mật khẩu" name="password" rules={[{ required: true }]}>
      <Input.Password />
    </Form.Item>
    <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
      <Select>
        <Option value="Admin">Quản trị viên</Option>
        <Option value="Receptionist">Lễ tân</Option>
        <Option value="Doctor">Bác sĩ</Option>
        <Option value="HRManager">Quản lý nhân viên</Option>
        <Option value="Pharmacist">Dược sĩ</Option>
        <Option value="Accountant">Kế toán</Option>
      </Select>
    </Form.Item>

    <Form.Item label="Phòng ban" name="department" rules={[{ required: true }]}>
      <Select placeholder="Chọn phòng ban">
        {departments.map((dep) => (
          <Option key={dep._id} value={dep._id}>
            {dep.name}
          </Option>
        ))}
      </Select>
    </Form.Item>

    <Form.Item label="Chuyên môn" name="specialization">
      <Input placeholder="Nhập chuyên môn (nếu có)" />
    </Form.Item>

    {/* ✅ Thêm Số điện thoại */}
    <Form.Item label="Số điện thoại" name="phone">
      <Input placeholder="Nhập số điện thoại (nếu có)" />
    </Form.Item>

<Form.Item label="Trạng thái" name="status" initialValue="active">
  <Select>
    <Option value="active">Đang hoạt động</Option>
    <Option value="inactive">Ngưng hoạt động</Option>
  </Select>
</Form.Item>

  </Form>
</Modal>

<Drawer
  title={`Lịch sử log - ${logEmployee?.name} (${logEmployee?.employeeCode})`}
  placement="right"
  onClose={() => setLogDrawerVisible(false)}
  open={logDrawerVisible}
  width={500}
>
  {employeeLogs.length === 0 ? (
    <p>Không có log</p>
  ) : (
    <ul>
      {employeeLogs.map((log, index) => (
        <li key={index} style={{ marginBottom: 12 }}>
          <p>
            <strong>Thời gian:</strong> {moment(log.createdAt).format("DD/MM/YYYY HH:mm:ss")}
          </p>
          <p><strong>Loại:</strong> {log.actionType}</p>
                <p>
        <strong>Người thực hiện:</strong>{" "}
        {log.actionBy?.name || "—"} ({log.actionBy?.employeeCode || "—"})
      </p>
          {log.description && <p><strong>Chi tiết:</strong> {log.description}</p>}
          {log.changes && (
            <div>
              <strong>Thay đổi:</strong>
              <ul>
{Object.entries(log.changes).map(([field, val]) => {
  const from = field === "department" ? getDepartmentNameById(val.from) : val.from;
  const to = field === "department" ? getDepartmentNameById(val.to) : val.to;
  return (
    <li key={field}>
      {field}: {from} → {to}
    </li>
  );
})}

              </ul>
            </div>
          )}
          <hr />
        </li>
      ))}
    </ul>
  )}
</Drawer>

    </div>
  );
}

export default EmployeeManagement;
