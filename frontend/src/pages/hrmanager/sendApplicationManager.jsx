import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, Typography, Modal, message, Form, Input } from "antd";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SendApplicationManager = () => {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token"); // 👈 Lấy token

    if (!user?._id || !token) {
      message.error("Không tìm thấy thông tin đăng nhập.");
      return;
    }

    const res = await axios.get(`/api/applications/received/${user._id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // 👈 Gửi token vào header
      },
    });

    setApplications(res.data || []);
    setFiltered(res.data || []);
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách đơn:", err);
    message.error("Lỗi khi tải danh sách đơn.");
  } finally {
    setLoading(false);
  }
};


  const handleFilterChange = (value) => {
    setStatusFilter(value);
    if (value === "all") {
      setFiltered(applications);
    } else {
      setFiltered(applications.filter((a) => a.status === value));
    }
  };

  const handleView = (record) => {
    setSelectedApp(record);
    setViewModal(true);
    form.setFieldsValue({
      status: record.status,
      reply: record.reply || "",
    });
  };

  const handleUpdateStatus = async (values) => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token"); // 👈 lấy token từ localStorage

    await axios.put(
      `/api/applications/${selectedApp._id}`,
      {
        status: values.status,
        reply: values.reply,
        decisionAt: new Date(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 gửi token lên
        },
      }
    );

    message.success("Cập nhật trạng thái đơn thành công!");
    setViewModal(false);
    setSelectedApp(null);
    form.resetFields();
    await fetchApplications(); // refresh danh sách
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật đơn:", err);
    message.error("Cập nhật trạng thái đơn thất bại.");
  } finally {
    setLoading(false);
  }
};


  const columns = [
    {
      title: "Người gửi",
      dataIndex: ["sender", "name"],
    },
    {
      title: "Phòng ban",
      dataIndex: ["sender", "department", "name"],
    },
    {
      title: "Tiêu đề",
      dataIndex: "subject",
    },
    {
      title: "Loại đơn",
      dataIndex: "templateType",
      render: (type) => type || "Khác",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const colorMap = {
          pending: "gold",
          approved: "green",
          rejected: "red",
          processing: "blue",
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Button size="small" onClick={() => handleView(record)}>
          Xem và xử lý
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3}>Quản lý Đơn đã nhận</Title>

      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <span>Lọc theo trạng thái:</span>
        <Select
          value={statusFilter}
          onChange={handleFilterChange}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="pending">Chờ duyệt</Option>
          <Option value="processing">Đang xử lý</Option>
          <Option value="approved">Đã duyệt</Option>
          <Option value="rejected">Từ chối</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Chưa có đơn nào." }}
      />

      <Modal
        open={viewModal}
        onCancel={() => {
          setViewModal(false);
          setSelectedApp(null);
          form.resetFields();
        }}
        title="Chi tiết và xử lý đơn"
        footer={null}
      >
        {selectedApp && (
          <div>
            <p><strong>Người gửi:</strong> {selectedApp.sender?.name}</p>
            <p><strong>Phòng ban:</strong> {selectedApp.sender?.department?.name}</p>
            <p><strong>Loại đơn:</strong> {selectedApp.templateType || "Khác"}</p>
            <p><strong>Tiêu đề:</strong> {selectedApp.subject}</p>
            {selectedApp.fields?.length > 0 && (
              <>
                <p><strong>Thông tin bổ sung:</strong></p>
                {selectedApp.fields.map((field, index) => (
                  <p key={index} style={{ marginLeft: 16 }}>
                    - {field}
                  </p>
                ))}
              </>
            )}
            <p><strong>Nội dung:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: 10, borderRadius: 4 }}>
              {selectedApp.content}
            </pre>
            {selectedApp.details && (
              <>
                <p><strong>Chi tiết bổ sung:</strong></p>
                <pre style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 10, borderRadius: 4 }}>
                  {selectedApp.details}
                </pre>
              </>
            )}
            <p><strong>Phản hồi hiện tại:</strong> {selectedApp.reply || "Chưa có phản hồi"}</p>

            <Form
              form={form}
              onFinish={handleUpdateStatus}
              layout="vertical"
              style={{ marginTop: 16 }}
            >
              <Form.Item
                name="status"
                label="Cập nhật trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
              >
                <Select>
                  <Option value="pending">Chờ duyệt</Option>
                  <Option value="processing">Đang xử lý</Option>
                  <Option value="approved">Đã duyệt</Option>
                  <Option value="rejected">Từ chối</Option>
                </Select>
              </Form.Item>
              <Form.Item name="reply" label="Phản hồi">
                <TextArea rows={4} placeholder="Nhập phản hồi (nếu có)" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SendApplicationManager;