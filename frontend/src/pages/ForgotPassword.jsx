import { Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import React, { useState } from 'react';
import '../assets/css/ForgotPass.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

    try {
      const response = await fetch('http://localhost:9999/api/auth/forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Mã OTP đã được gửi qua email.');
      } else {
        setError(data.message || 'Gửi yêu cầu thất bại.');
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
              <h2 className="text-center mb-4">Quên Mật Khẩu</h2>
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
                <button
                  type="submit"
                  className="submit-button w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              </Form>
              <div className="text-center mt-3">
                <Link to="/login">Quay lại đăng nhập</Link> |{' '}
                <Link to="/reset-password">Đã có mã? Đặt lại mật khẩu</Link>
              </div>
            </Col>
          </Row>
        </Container>
      </Container>

      <FooterComponent />
    </>
  );
};

export default ForgotPassword;