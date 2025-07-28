import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  HomeOutlined,
  InfoCircleOutlined,
  BookOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TwitterOutlined,
  FacebookOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  ApartmentOutlined,
  CustomerServiceOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
// Optional: Uncomment if authentication is needed
// import { useAuth } from "../context/authContext";

const FooterComponent = () => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // Optional: Uncomment if authentication is needed
  // const { token } = useAuth();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:9999/api/user/department", {
          // Optional: Uncomment if authentication is needed
          // headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log("Raw API Response:", res); // Log full response
        console.log("API Data:", res.data); // Log data portion

        // Normalize response data
        let data = res.data;
        if (!Array.isArray(data)) {
          data = res.data.data || res.data.departments || [];
          console.log("Normalized Data:", data); // Log normalized data
        }

        if (!Array.isArray(data)) {
          throw new Error("API response is not an array");
        }

        setDepartments(data);
        console.log("Set Departments:", data); // Log state update
        setError(null);
      } catch (error) {
        console.error("Error fetching departments:", {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
          } : null,
        });
        setError("Không thể tải danh sách chuyên khoa. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        console.log("Loading Complete, Departments:", departments); // Log final state
      }
    };

    fetchDepartments();
  }, []); // Add token to dependency array if using authentication: [token]

  return (
    <footer className="bg-dark text-light pt-5">
      <Container>
        <Row className="pt-4">
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Giới Thiệu Về Kiwicare</h5>
            <p className="text-light">
              Kiwicare là phòng khám đa khoa hàng đầu, cung cấp dịch vụ y tế toàn diện với công nghệ hiện đại và đội ngũ bác sĩ chuyên môn cao. Chúng tôi cam kết mang đến sự chăm sóc sức khỏe tận tâm và chất lượng cho mọi bệnh nhân.
            </p>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Liên Kết Phổ Biến</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-light d-flex align-items-center">
                  <HomeOutlined className="me-2" />
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-light d-flex align-items-center">
                  <InfoCircleOutlined className="me-2" />
                  Giới Thiệu
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-light d-flex align-items-center">
                  <BookOutlined className="me-2" />
                  Bài Đăng
                </Link>
              </li>
              <li>
                <Link to="/department-home" className="text-light d-flex align-items-center">
                  <ApartmentOutlined className="me-2" />
                  Chuyên Khoa
                </Link>
              </li>
              <li>
                <Link to="/service-home" className="text-light d-flex align-items-center">
                  <CustomerServiceOutlined className="me-2" />
                  Dịch Vụ
                </Link>
              </li>
              <li>
                <Link to="/doctor-home" className="text-light d-flex align-items-center">
                  <TeamOutlined className="me-2" />
                  Bác Sĩ
                </Link>
              </li>
              <li>
                <Link to="/medicines-home" className="text-light d-flex align-items-center">
                  <MedicineBoxOutlined className="me-2" />
                  Thuốc
                </Link>
              </li>
              <li>
                <Link to="/appointment" className="text-light d-flex align-items-center">
                  <CalendarOutlined className="me-2" />
                  Lịch Hẹn
                </Link>
              </li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Chuyên Khoa</h5>
            <ul className="list-unstyled">
              {loading ? (
                <li>
                  <span className="text-light">Đang tải chuyên khoa...</span>
                </li>
              ) : error ? (
                <li>
                  <span className="text-light">{error}</span>
                </li>
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <li key={dept._id || dept.id}>
                    <Link to={`/department/${dept._id || dept.id}`} className="text-light">
                      {dept.departmentName || dept.name || "Chuyên khoa không xác định"}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <span className="text-light">Không có chuyên khoa nào được tìm thấy.</span>
                </li>
              )}
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4" style={{ paddingRight: "20px", paddingLeft: "20px" }}>
            <h5 className="text-white mb-4">Liên Hệ Với Chúng Tôi</h5>
            <p className="text-light">
              <EnvironmentOutlined className="text-primary me-2" />
              Cầu Giấy, Hà Nội, Việt Nam
            </p>
            <p className="text-light">
              <MailOutlined className="text-primary me-2" />
              contact@kiwicare.com
            </p>
            <p className="text-light">
              <PhoneOutlined className="text-primary me-2" />
              +098 765 4321
            </p>
            <h6 className="text-white mt-4">Theo Dõi Chúng Tôi</h6>
            <div className="d-flex">
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded me-2"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinOutlined />
              </a>
              <a
                className="btn btn-primary btn-lg-square rounded"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramOutlined />
              </a>
            </div>
          </Col>
        </Row>
        <div className="text-center py-3 border-top border-light mt-4">
          <p className="mb-0">
            © <span className="text-white">Kiwicare</span>. All Rights Reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default FooterComponent;