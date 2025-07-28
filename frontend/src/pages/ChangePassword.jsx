import { Container, Row, Col, Form, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import bcrypt from 'bcryptjs';
const Changepass = () => {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

// Lấy email từ token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEmail(decoded.email || ''); // Giả sử token chứa trường email
        

      } catch (err) {
        console.error('Lỗi giải mã token:', err);
        setError('Token không hợp lệ, vui lòng đăng nhập lại.');
      }
    } else {
      setError('Bạn cần đăng nhập để đổi mật khẩu.');
    }
  }, []);

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    // Lấy password từ localStorage để so sánh
    const userData = localStorage.getItem('user');
    let storedPassword = '';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        storedPassword = user.password || '';
      } catch  {
        setError('Dữ liệu người dùng không hợp lệ.');
        setIsLoading(false);
        return;
      }
    }
     const isMatch = await bcrypt.compare(oldPassword, storedPassword);
  if (!isMatch) {
    setError('Mật khẩu cũ không đúng.');
    setIsLoading(false);
    return;
  }
    if (!validatePassword(newPassword)) {
      setError('Mật khẩu mới phải dài ít nhất 8 ký tự.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== newPassword2) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Bạn cần đăng nhập để đổi mật khẩu.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:9999/api/auth/updatePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, oldPassword, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Đổi mật khẩu thành công!');
      } else {
        setError(data.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      console.error('Lỗi:', err);
      setError('Lỗi kết nối server, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Container fluid className="py-5">
  <Container>
    <Row className="justify-content-center">
      <Col md={6} lg={4}>
        <h2 className="text-center mb-4">Đổi Mật Khẩu</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="oldPassWord">
            <Form.Label>Mật khẩu cũ</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu cũ của bạn"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>Mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="newPassword2">
            <Form.Label>Xác nhận mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              required
            />
          </Form.Group>
          <button
                  type="submit"
                  className="submit-button w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
        </Form>
        <div className="text-center mt-3">
          <Link to="/">Quay lại trang chủ</Link>
        </div>
      </Col>
    </Row>
  </Container>
</Container>

    </>
  );
};

export default Changepass;