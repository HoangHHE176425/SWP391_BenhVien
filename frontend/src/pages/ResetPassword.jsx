import { Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import React, { useState } from 'react';
import '../assets/css/ForgotPass.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError('Vui lòng nhập email hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (!code) {
      setError('Vui lòng nhập mã OTP.');
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

    try {
      const response = await fetch('http://localhost:9999/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Đặt lại mật khẩu thành công!');
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại.');
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
      <div className="bg-light py-2 px-5 d-none d-lg-block">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small>
              <i className="far fa-clock text-primary me-2"></i>
              Opening Hours: Mon - Sat : 7.00 am - 8.00 pm, Sunday 9.00 am - 5.00 pm
            </small>
          </Col>
          <Col md={6} className="text-end">
            <small className="me-4">
              <i className="fa fa-envelope-open text-primary me-2"></i>
              contact@kiwicare.com
            </small>
            <small>
              <i className="fa fa-phone-alt text-primary me-2"></i>
              +987 654 3210
            </small>
          </Col>
        </Row>
      </div>

      <HeaderComponent />

      <Container fluid className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={6} lg={4}>
              <h2 className="text-center mb-4">Đặt Lại Mật Khẩu</h2>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="code">
                  <Form.Label>Mã OTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </Form.Group>
                <button
                  type="submit"
                  className="submit-button w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </Form>
              <div className="text-center mt-3">
                <Link to="/login">Quay lại đăng nhập</Link> |{' '}
                <Link to="/forgot-password">Gửi lại mã</Link>
              </div>
            </Col>
          </Row>
        </Container>
      </Container>

      <FooterComponent />
    </>
  );
};

export default ResetPassword;