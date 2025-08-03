import React, { useEffect, useState } from "react";
import { Table, Typography, Modal, message, Form, Input, Button, Select } from "antd";
import axios from "axios";
import { useAuth } from "../../context/authContext";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FeedbackManagePage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0.0,
    positivePercentage: 0.0,
  });
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [form] = Form.useForm();
  const { token } = useAuth();

  // Hàm lấy danh sách feedback từ API
  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/receptionist/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setFeedbacks(data);
      setFiltered(data); // Ban đầu hiển thị toàn bộ
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách feedback:", err);
      message.error("Không thể tải feedback.");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchFeedbacks();
  }, [token]);

  // Tính toán thống kê khi feedbacks thay đổi
  const calculateStats = (data) => {
    const total = data.length;
    const totalRating = data.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = total > 0 ? (totalRating / total).toFixed(1) : 0.0;
    const positiveCount = data.filter((fb) => fb.rating >= 4).length;
    const positivePercentage = total > 0 ? ((positiveCount / total) * 100).toFixed(1) : 0.0;
    return { total, averageRating, positivePercentage };
  };

  useEffect(() => {
    const newStats = calculateStats(feedbacks);
    setStats(newStats);
  }, [feedbacks]);

  // Hàm xử lý thay đổi bộ lọc rating
  const handleFilterChange = (value) => {
    setRatingFilter(value);
    if (value === "all") {
      setFiltered(feedbacks);
    } else {
      const ratingValue = parseInt(value, 10);
      setFiltered(feedbacks.filter((fb) => fb.rating === ratingValue));
    }
  };

  // Hàm mở modal xem chi tiết và xử lý feedback
  const handleView = (record) => {
    setSelectedFeedback(record);
    setViewModal(true);
    form.setFieldsValue({
      reply: record.reply || "",
    });
  };

  // Hàm cập nhật phản hồi feedback
  const handleUpdateReply = async (values) => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:9999/api/receptionist/feedback/${selectedFeedback._id}`,
        {
          reply: values.reply,
          updatedAt: new Date(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success("Cập nhật phản hồi feedback thành công!");
      setViewModal(false);
      setSelectedFeedback(null);
      form.resetFields();
      await fetchFeedbacks(); // Refresh danh sách
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật feedback:", err);
      message.error("Cập nhật phản hồi feedback thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: "Người đánh giá",
      dataIndex: ["userId", "name"],
      render: (name, record) => name || record.guestName || "(Ẩn danh)",
    },
    {
      title: "Nội dung",
      dataIndex: "content",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      render: (rating) => `${rating} sao`,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Lịch hẹn",
      dataIndex: ["appointmentId", "appointmentDate"],
      render: (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "-"),
    },
    {
      title: "Bác sĩ",
      dataIndex: ["appointmentId", "doctorId", "name"],
      render: (name) => name || "-",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3}>Quản lý Feedback</Title>

      {/* Thống kê nhanh */}
      <div style={{ marginBottom: 16 }}>
        <p><strong>Tổng số feedback:</strong> {stats.total}</p>
        <p><strong>Số feedback trung bình:</strong> {stats.averageRating} sao</p>
        <p><strong>Tỉ lệ feedback tích cực:</strong> {stats.positivePercentage}%</p>
      </div>

      {/* Bộ lọc theo rating */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <span>Lọc theo đánh giá:</span>
        <Select
          value={ratingFilter}
          onChange={handleFilterChange}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="5">5 sao</Option>
          <Option value="4">4 sao</Option>
          <Option value="3">3 sao</Option>
          <Option value="2">2 sao</Option>
          <Option value="1">1 sao</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Chưa có feedback nào." }}
        onRow={(record) => ({
          onClick: () => handleView(record), // Nhấn vào hàng để mở modal
        })}
      />

      <Modal
        open={viewModal}
        onCancel={() => {
          setViewModal(false);
          setSelectedFeedback(null);
          form.resetFields();
        }}
        title="Chi tiết và xử lý Feedback"
        footer={null}
      >
        {selectedFeedback && (
          <div>
            <p><strong>Người đánh giá:</strong> {selectedFeedback.userId?.name || selectedFeedback.guestName || "(Ẩn danh)"}</p>
            <p><strong>Đánh giá:</strong> {selectedFeedback.rating} sao</p>
            <p><strong>Lịch hẹn:</strong> {selectedFeedback.appointmentId ? new Date(selectedFeedback.appointmentId.appointmentDate).toLocaleDateString("vi-VN") : "-"}</p>
            <p><strong>Bác sĩ:</strong> {selectedFeedback.appointmentId?.doctorId?.name || "-"}</p>
            <p><strong>Nội dung:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: 10, borderRadius: 4 }}>
              {selectedFeedback.content}
            </pre>
            <p><strong>Phản hồi hiện tại:</strong> {selectedFeedback.reply || "Chưa có phản hồi"}</p>

            <Form
              form={form}
              onFinish={handleUpdateReply}
              layout="vertical"
              style={{ marginTop: 16 }}
            >
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

export default FeedbackManagePage;