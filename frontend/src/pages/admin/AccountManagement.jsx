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
} from "antd";
import axios from "axios";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

function AccountManagement() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [userCodeSearch, setUserCodeSearch] = useState("");
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedUserCode, setSelectedUserCode] = useState("");

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lấy danh sách người dùng");
    }
  };
  const fetchUserLogs = async (userId, userCode) => {
    try {
      const response = await axios.get(`/api/admin/user-log/${userId}`);
      setLogs(response.data);
      setSelectedUserCode(userCode);
      setLogModalVisible(true);
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description: "Không thể lấy log người dùng",
      });
    }
  };
  // Submit cập nhật thông tin
  const handleEditSubmit = async () => {
    try {
      const { confirmPassword, password, ...values } = await form.validateFields();
      if (password) values.password = password;
      await axios.put(`/api/admin/updateUser/${editingUser._id}`, values);
      notification.success({
        message: "Thành công",
        description: "Tài khoản đã được cập nhật.",
      });

      setEditModalVisible(false);
      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description: err.response?.data?.message || "Cập nhật thất bại",
      });
    }
  };



  const handleCreateUser = async () => {
    try {
      const { confirmPassword, ...values } = await createForm.validateFields();

      await axios.post(`/api/admin/createUser`, values);

      notification.success({
        message: "Thành công",
        description: "Tài khoản mới đã được tạo.",
      });

      setCreateModalVisible(false);
      createForm.resetFields();
      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description: err.response?.data?.message || "Tạo tài khoản thất bại",
      });
    }
  };


  // Mở modal chỉnh sửa
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditModalVisible(true);
    form.setFieldsValue({
      user_code: user.user_code,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    });
  };

  // Đổi trạng thái tài khoản
  const handleChangeStatus = async (id) => {
    try {
      await axios.put(`/api/admin/changeStatus/${id}`); // ✅ đúng route đã có
      notification.success({
        message: "Thành công",
        description: "Trạng thái tài khoản đã được cập nhật.",
      });

      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description: err.response?.data?.message || "Không thể cập nhật trạng thái",
      });
    }
  };


useEffect(() => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
  fetchUsers();
}, []);


  // Lọc dữ liệu người dùng
  const filteredUsers = users.filter((user) => {
    const lowerSearch = searchText.toLowerCase();
    const matchKeyword =
      user.name.toLowerCase().includes(lowerSearch) ||
      user.user_code?.toLowerCase().includes(lowerSearch);

    const matchStatus = statusFilter ? user.status === statusFilter : true;
    const matchDate = dateRange
      ? new Date(user.createdAt) >= dateRange[0] &&
        new Date(user.createdAt) <= dateRange[1]
      : true;

    return matchKeyword && matchStatus && matchDate;
  });

  return (
    <div>
      <h1>Quản Lý Người Dùng</h1>
    
      {/* Bộ lọc */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Input
          placeholder="Tìm kiếm theo tên hoặc mã"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Trạng thái"
          onChange={(value) => setStatusFilter(value)}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="active">Đang hoạt động</Option>
          <Option value="inactive">Đã bị khóa</Option>
        </Select>
        <RangePicker
          onChange={(dates) => setDateRange(dates)}
          allowClear
          format="DD/MM/YYYY"
          placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
        />
        <Button
          onClick={() => {
            setSearchText("");
            setStatusFilter(null);
            setDateRange(null);
          }}
        >
          Đặt lại bộ lọc
        </Button>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>
            Thêm mới
          </Button>
        </Space>

      </div>
            
      {/* Bảng người dùng */}
      <Table
        dataSource={filteredUsers}
        rowKey="_id"
        columns={[
          {
            title: "Mã",
            dataIndex: "user_code",
            sorter: (a, b) => a.user_code.localeCompare(b.user_code),
          },
          {
            title: "Tên", // ✅ thêm dòng này
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
          },

          { title: "Email", dataIndex: "email" },
          { title: "Số điện thoại", dataIndex: "phone" }, 
          {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => (
              <Tag color={status === "active" ? "green" : "red"}>
                {status === "active" ? "Đang hoạt động" : "Đã bị khóa"}
              </Tag>
            ),
          },
          {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (date) => moment(date).format("DD-MM-YYYY HH:mm"),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          },
          {
            title: "Hành động",
            render: (_, record) => (
              <Space>
                <Button
                  type={record.status === "active" ? "default" : "primary"}
                  danger={record.status === "active"}
                  onClick={() => handleChangeStatus(record._id)}
                >
                  {record.status === "active" ? "Khóa tài khoản" : "Kích hoạt lại"}
                </Button>
                <Button onClick={() => openEditModal(record)}>Chỉnh sửa</Button>
                <Button onClick={() => fetchUserLogs(record._id, record.user_code)}>Xem log</Button>
              </Space>
            ),
          },
        ]}
      />

      {/* Modal chỉnh sửa tài khoản */}
<Modal
  title="Chỉnh sửa tài khoản"
  open={editModalVisible}
  onCancel={() => setEditModalVisible(false)}
  onOk={handleEditSubmit}
  okText="Lưu"
  cancelText="Hủy"
>
  <Form layout="vertical" form={form}>
    {/* Mã người dùng (không chỉnh sửa) */}
    <Form.Item label="Mã người dùng" name="user_code">
      <Input disabled />
    </Form.Item>

    {/* Tên */}
    <Form.Item
          name="name"
          label="Tên"
          rules={[
    { required: true, message: "Vui lòng nhập tên" },
    { min: 2, message: "Tên phải có ít nhất 2 ký tự" },
    {
      validator: (_, value) => {
        if (value && value.trim().length === 0) {
          return Promise.reject("Tên không được toàn khoảng trắng");
        }
        return Promise.resolve();
        },
      },
    ]}
    >
      <Input />
    </Form.Item>

    {/* Email */}
    <Form.Item
      name="email"
      label="Email"
      rules={[
        { required: true, message: "Vui lòng nhập email" },
        { type: "email", message: "Email không hợp lệ" },
      ]}
    >
      <Input />
    </Form.Item>

    {/* Số điện thoại */}
    <Form.Item name="phone" label="Số điện thoại" rules={[
        {
          pattern: /^0\d{9}$/,
          message: "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
        },
      ]}
      >
      <Input />
    </Form.Item>

    {/* Mật khẩu mới */}
    <Form.Item
      name="password"
      label="Mật khẩu mới"
      rules={[
        {
          min: 6,
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        },
      ]}
      hasFeedback
    >
      <Input.Password />
    </Form.Item>

    {/* Nhập lại mật khẩu */}
    <Form.Item
      name="confirmPassword"
      label="Nhập lại mật khẩu"
      dependencies={["password"]}
      hasFeedback
      rules={[
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue("password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("Mật khẩu không khớp"));
          },
        }),
      ]}
    >
      <Input.Password />
    </Form.Item>
  </Form>
</Modal>



<Modal
  title="Tạo người dùng mới"
  open={createModalVisible}
  onCancel={() => {
    setCreateModalVisible(false);
    createForm.resetFields();
  }}
  onOk={handleCreateUser}
  okText="Tạo"
  cancelText="Hủy"
>
  <Form layout="vertical" form={createForm}>
    <Form.Item
      name="name"
      label="Tên"
      rules={[{ required: true, message: "Vui lòng nhập tên" }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="email"
      label="Email"
      rules={[{ required: true, message: "Vui lòng nhập email" }]}
    >
      <Input />
    </Form.Item>
<Form.Item
  name="password"
  label="Mật khẩu"
  rules={[
    { required: true, message: "Vui lòng nhập mật khẩu" },
    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
  ]}
  hasFeedback
>
  <Input.Password />
</Form.Item>
  <Form.Item
    name="confirmPassword"
    label="Nhập lại mật khẩu"
    dependencies={['password']}
    hasFeedback
    rules={[
      { required: true, message: "Vui lòng nhập lại mật khẩu" },
      ({ getFieldValue }) => ({
        validator(_, value) {
          if (!value || getFieldValue('password') === value) {
            return Promise.resolve();
          }
          return Promise.reject(new Error("Mật khẩu không khớp"));
        },
      }),
    ]}
  >
    <Input.Password />
  </Form.Item>
    <Form.Item name="phone" label="Số điện thoại">
      <Input />
    </Form.Item>
  </Form>
</Modal>
<Modal
  title={`Lịch sử hoạt động: ${selectedUserCode}`}
  open={logModalVisible}
  onCancel={() => setLogModalVisible(false)}
  footer={null}
  width={700}
>
  <Table
    dataSource={logs}
    rowKey="_id"
    pagination={{ pageSize: 5 }}
    columns={[
      {
        title: "Thao tác",
        dataIndex: "actionType",
        render: (text) => {
          const map = {
            create: "Tạo",
            update: "Cập nhật",
            delete: "Xóa",
            changeStatus: "Đổi trạng thái",
          };
          return map[text] || text;
        },
      },
      {
        title: "Người thực hiện",
        dataIndex: "actionBy",
        render: (val) => {
          const name = val?.name || "Không rõ";
          const code = val?.employeeCode || val?.user_code || "";
          return code ? `${name} (${code})` : name;
        },
      },
      {
        title: "Thời gian",
        dataIndex: "createdAt",
        render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Chi tiết thay đổi",
        dataIndex: "changes",
        render: (changes) =>
          changes
            ? Object.entries(changes)
                .map(([key, val]) => `${key}: ${val.from} → ${val.to}`)
                .join(", ")
            : "-",
      },
    ]}
  />
</Modal>


    </div>
  );
}

export default AccountManagement;
