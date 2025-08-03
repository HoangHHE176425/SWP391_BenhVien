import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Alert, Form, Button, Modal, Row, Col } from "react-bootstrap";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // State mới cho bộ lọc theo rating
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ guestName: "", guestEmail: "", content: "", rating: 5 });
  const [stats, setStats] = useState({ total: 0, averageRating: 0.0, positivePercentage: 0.0 }); // State mới cho thống kê

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/receptionist/feedback");
      const data = Array.isArray(res.data) ? res.data : [];
      setFeedbacks(data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu phản hồi:", err);
      setError("Không thể tải phản hồi.");
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFeedbacks();
  }, []);

  // Tính toán thống kê khi feedbacks thay đổi
  useEffect(() => {
    if (feedbacks.length > 0) {
      const total = feedbacks.length;
      const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
      const averageRating = (totalRating / total).toFixed(1);
      const positiveCount = feedbacks.filter((fb) => fb.rating >= 4).length;
      const positivePercentage = ((positiveCount / total) * 100).toFixed(1);
      setStats({ total, averageRating, positivePercentage });
    } else {
      setStats({ total: 0, averageRating: 0.0, positivePercentage: 0.0 });
    }
  }, [feedbacks]);

  // Filter feedbacks theo tên bác sĩ và rating
  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesDoctor = searchTriggered ? fb.appointmentId?.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesRating = ratingFilter === 'all' ? true : fb.rating === parseInt(ratingFilter, 10);
    return matchesDoctor && matchesRating;
  });

  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = async () => {
    if (!feedbackData.content) {
      alert("Vui lòng điền nội dung và đánh giá hợp lệ!");
      return;
    }

    // Kiểm tra content không chứa số
    if (!/^[^\d]*$/.test(feedbackData.content)) {
      alert("Nội dung đánh giá không được chứa số!");
      return;
    }

    try {
      await axios.post("http://localhost:9999/api/user/feedback/guest", feedbackData);
      alert("Gửi feedback thành công!");
      setShowFeedbackModal(false);
      setFeedbackData({ guestName: "", guestEmail: "", content: "", rating: 5 });
      window.location.reload(); // Reload trang sau khi gửi thành công
    } catch (err) {
      console.error("Gửi feedback thất bại:", err);
      alert("Gửi feedback thất bại. Vui lòng thử lại.");
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      alert("Vui lòng nhập tên bác sĩ để tìm!");
      return;
    }
    setSearchTriggered(true);
  };

  const handleReset = () => {
    setSearchTerm('');
    setRatingFilter('all'); // Reset cả bộ lọc rating
    setSearchTriggered(false);
  };

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary fw-bold">Phản Hồi Của Khách Hàng</h2>
        <Button variant="primary" onClick={openFeedbackModal}>Gửi Feedback</Button>
      </div>

      {/* Thống kê nhanh */}
      <Row className="mb-4">
        <Col md={4}>
          <Alert variant="info">
            <strong>Tổng số feedback:</strong> {stats.total}
          </Alert>
        </Col>
        <Col md={4}>
          <Alert variant="info">
            <strong>Số feedback trung bình:</strong> {stats.averageRating} sao
          </Alert>
        </Col>
        <Col md={4}>
          <Alert variant="info">
            <strong>Tỉ lệ feedback tích cực:</strong> {stats.positivePercentage}%
          </Alert>
        </Col>
      </Row>

      <Form.Group className="mb-4 d-flex align-items-end">
        <div style={{ flex: 1 }}>
          <Form.Label>Tìm theo tên bác sĩ:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tên bác sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ms-3" style={{ width: 200 }}>
          <Form.Label>Lọc theo đánh giá:</Form.Label>
          <Form.Select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </Form.Select>
        </div>
        <Button variant="primary" className="ms-2" onClick={handleSearch}>Tìm</Button>
        <Button variant="secondary" className="ms-2" onClick={handleReset}>Reset</Button>
      </Form.Group>

      {filteredFeedbacks.length === 0 ? (
        <Alert variant="info">Không có phản hồi nào phù hợp.</Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered hover className="align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>Nội dung</th>
                <th>Đánh giá</th>
                <th>Ngày gửi</th>
                <th>Lịch hẹn</th>
                <th>Bác sĩ</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>Ẩn danh</td>
                  <td>{fb.content}</td>
                  <td>{fb.rating} sao</td>
                  <td>{new Date(fb.createdAt).toLocaleString("vi-VN")}</td>
                  <td>{fb.appointmentId ? new Date(fb.appointmentId.appointmentDate).toLocaleDateString("vi-VN") : "-"}</td>
                  <td>{fb.appointmentId?.doctorId?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Gửi Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Tên (tùy chọn)</Form.Label>
              <Form.Control
                type="text"
                value={feedbackData.guestName}
                onChange={(e) => setFeedbackData({ ...feedbackData, guestName: e.target.value })}
                placeholder="Nhập Họ và Tên"
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Nội dung</Form.Label>
              <Form.Control
                as="textarea"
                value={feedbackData.content}
                onChange={(e) => setFeedbackData({ ...feedbackData, content: e.target.value })}
                placeholder="Điền nội dung đánh giá"
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Đánh giá</Form.Label>
              <Form.Select
                value={feedbackData.rating}
                onChange={(e) => setFeedbackData({ ...feedbackData, rating: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} sao
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendFeedback}>
            Gửi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeedbackList;