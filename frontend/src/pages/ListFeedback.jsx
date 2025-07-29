import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Alert, Form, Button, Modal } from "react-bootstrap";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Để tìm theo tên bác sĩ
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State mới cho modal gửi feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ guestName: "", guestEmail: "", doctorId: "", content: "", rating: 5 });
  const [doctors, setDoctors] = useState([]) // Sửa typo: thiếu dấu chấm phẩy ở code gốc, nhưng không ảnh hưởng lỗi.

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/staff/feedback");
      // SỬA: Đảm bảo setFeedbacks luôn array, dù res.data là gì (object, null, undefined)
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu phản hồi:", err);
      setError("Không thể tải phản hồi.");
      setFeedbacks([]); // SỬA: Set [] nếu error, tránh undefined
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (showFeedbackModal) { // Chỉ fetch khi mở modal để tối ưu
      const fetchDoctors = async () => {
        try {
          const res = await axios.get("http://localhost:9999/api/doctor/doctor"); 
          setDoctors(Array.isArray(res.data) ? res.data : []); // SỬA tương tự: Đảm bảo doctors luôn array
        } catch (err) {
          console.error("Lỗi lấy danh sách bác sĩ:", err);
          alert("Không thể tải danh sách bác sĩ. Bạn có thể bỏ qua field này.");
          setDoctors([]); // Fallback
        }
      };
      fetchDoctors();
    }
  }, [showFeedbackModal]);

  // Filter feedbacks theo tên bác sĩ (chỉ khi searchTriggered = true)
  const filteredFeedbacks = searchTriggered
    ? (Array.isArray(feedbacks) ? feedbacks.filter(fb => fb.appointmentId?.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) : []) // SỬA: Đảm bảo filter trên array, fallback []
    : (Array.isArray(feedbacks) ? feedbacks : []); // SỬA: Luôn trả array

  // Mở modal gửi feedback
  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  // Gửi feedback (guest, không cần token)
  const handleSendFeedback = async () => {
    if (!feedbackData.content || feedbackData.rating < 1 || feedbackData.rating > 5) {
      alert("Vui lòng điền nội dung và đánh giá hợp lệ!");
      return;
    }

    try {
      await axios.post("http://localhost:9999/api/user/feedback/guest", feedbackData); // API public, không token
      alert("Gửi feedback thành công!");
      setShowFeedbackModal(false);
      setFeedbackData({ guestName: "", guestEmail: "", doctorId: "", content: "", rating: 5 }); // Reset form
      fetchFeedbacks(); // Refresh danh sách feedbacks sau khi gửi
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
    setSearchTriggered(true); // Kích hoạt filter
  };

  // Hàm bấm nút Reset (mới): Clear và hiển thị hết
  const handleReset = () => {
    setSearchTerm('');
    setSearchTriggered(false); // Tắt filter, hiển thị hết
  };

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary fw-bold">Phản Hồi Của Khách Hàng</h2>
        {/* Button gửi feedback (giữ nguyên) */}
        <Button variant="primary" onClick={openFeedbackModal}>Gửi Feedback</Button>
      </div>

      {/* Input tìm theo tên bác sĩ + nút Tìm và Reset (mới) */}
      <Form.Group className="mb-4 d-flex align-items-end">
        <div style={{ flex: 1 }}>
          <Form.Label>Tìm theo tên bác sĩ:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tên bác sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Chỉ update state, không filter ngay
          />
        </div>
        <Button variant="primary" className="ms-2" onClick={handleSearch}>Tìm</Button> {/* Nút Tìm mới */}
        <Button variant="secondary" className="ms-2" onClick={handleReset}>Reset</Button> {/* Nút Reset mới */}
      </Form.Group>

      {filteredFeedbacks.length === 0 ? ( // SỬA: Không cần check Array.isArray vì đã fallback ở trên, nhưng length an toàn vì array rỗng có length=0
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
              {filteredFeedbacks.map((fb) => ( // Giữ nguyên, giờ filteredFeedbacks luôn array nên an toàn
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

      {/* Modal gửi feedback*/}
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
              <Form.Label>Bác Sĩ (tùy chọn)</Form.Label>
              <Form.Select
                value={feedbackData.doctorId}
                onChange={(e) => setFeedbackData({ ...feedbackData, doctorId: e.target.value })} // Set doctorId khi chọn
              >
                <option value="">Chọn bác sĩ...</option> {/* Option default, doctorId rỗng */}
                {doctors.map((doc) => ( // Giữ nguyên, giờ doctors luôn array
                  <option key={doc._id} value={doc._id}>{doc.name}</option> // Value = _id (ID), text = name
                ))}
              </Form.Select>
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