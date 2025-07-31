import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  DatePicker,
  Switch,
  Modal,
  Form,
  message,
  Space,
  Tag,
  AutoComplete,
} from "antd";
import { PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { useAuth } from "../../context/authContext";

const { RangePicker } = DatePicker;
const { confirm } = Modal;

const NotificationManagement = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [userEmails, setUserEmails] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);

  const fetchUserEmails = async () => {
    try {
      const res = await axios.get(
        "http://localhost:9999/api/receptionist/getAllUserEmails",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserEmails(res.data);
    } catch (err) {
      message.error("Failed to fetch user emails");
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:9999/api/receptionist/getNoti", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
      setFiltered(res.data);
    } catch (err) {
      message.error("Failed to fetch notifications");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter logic
  const handleSearch = (values) => {
    const { title, receiver, dateRange, isUrgent } = values;

    let filteredData = [...notifications];

    if (title) {
      filteredData = filteredData.filter((item) =>
        item.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (receiver) {
      filteredData = filteredData.filter(
        (item) =>
          (item.receiver &&
            item.receiver.email
              .toLowerCase()
              .includes(receiver.toLowerCase())) ||
          (receiver.toLowerCase() === "all" && item.receiver === null)
      );
    }

    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filteredData = filteredData.filter((item) =>
        moment(item.createdAt).isBetween(start, end, null, "[]")
      );
    }

    if (isUrgent !== undefined) {
      filteredData = filteredData.filter((item) => item.isUrgent === isUrgent);
    }

    setFiltered(filteredData);
  };

  const handleDelete = (id) => {
    confirm({
      title: "Confirm delete",
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await axios.delete(`http://localhost:9999/api/receptionist/deleteNoti/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Deleted");
        fetchNotifications();
      },
    });
  };

  const handleCreate = async (values) => {
    console.log("Creating notification with:", values);
    await axios.post("http://localhost:9999/api/receptionist/createNoti", values, {
      headers: { Authorization: `Bearer ${token}` },
    });
    message.success("Notification created");
    setShowModal(false);
    form.resetFields();
    fetchNotifications();
  };

  const handleToggleUrgent = async (id, isUrgent) => {
    await axios.put(
      `http://localhost:9999/api/receptionist/urgent/${id}`,
      { isUrgent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchNotifications();
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      ellipsis: true,
    },
    {
      title: "Người nhận",
      dataIndex: ["receiver", "email"],
      render: (email, record) =>
        email || <Tag color="blue">Tất cả người dùng</Tag>,
    },
    {
      title: "Khẩn cấp",
      dataIndex: "isUrgent",
      render: (isUrgent, record) => (
        <Switch
          checked={isUrgent}
          onChange={(checked) => handleToggleUrgent(record._id, checked)}
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date) => moment(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record._id)}>
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>Quản lý thông báo</h2>
      <Form
        layout="inline"
        onFinish={handleSearch}
        onValuesChange={(_, values) => handleSearch(values)}
      >
        <Form.Item name="title">
          <Input placeholder="Tìm theo tiêu đề" allowClear />
        </Form.Item>
        <Form.Item name="receiver">
          <Input placeholder="Email người nhận / all" allowClear />
        </Form.Item>
        <Form.Item name="dateRange">
          <RangePicker placeholder={["Ngày bắt đầu", "Ngày kết thúc"]} />
        </Form.Item>
        <Form.Item name="isUrgent" valuePropName="checked">
          <Switch checkedChildren="Khẩn cấp" unCheckedChildren="Bình thường" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Tìm kiếm
          </Button>
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => {
              form.resetFields();
              setFiltered(notifications);
            }}
          >
            Đặt lại
          </Button>
        </Form.Item>
        <Form.Item>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setShowModal(true);
              fetchUserEmails();
            }}
          >
            Tạo thông báo
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        style={{ marginTop: 20 }}
      />

      <Modal
        title="Tạo thông báo"
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="receiverEmail" label="Email người nhận (tùy chọn)">
            <AutoComplete
              options={filteredOptions}
              onSearch={(value) => {
                if (value) {
                  const filtered = userEmails
                    .filter((email) =>
                      email.toLowerCase().includes(value.toLowerCase())
                    )
                    .map((email) => ({ value: email }));
                  setFilteredOptions(filtered);
                } else {
                  setFilteredOptions([]);
                }
              }}
              placeholder="Nhập email — để trống nếu gửi cho tất cả"
            />
          </Form.Item>

          <Form.Item name="isUrgent" valuePropName="checked">
            <Switch
              checkedChildren="Khẩn cấp"
              unCheckedChildren="Bình thường"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationManagement;
