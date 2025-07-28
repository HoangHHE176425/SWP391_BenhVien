import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import "../assets/css/DoctorPage.css";
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from "../components/TopBarComponent";

const DEPT_BANNER = "https://images.unsplash.com/photo-1579684453423-f84349ef60b0";

const DoctorPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(11); // Số bác sĩ mỗi trang

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const params = {
          page: currentPage,
          limit: doctorsPerPage,
          searchTerm: searchTerm,
          specialization: selectedSpecialization,
        };
        const res = await axios.get("/api/user/doctor", { params });
        if (res.data.doctors) {
          setDoctors(res.data.doctors);
          setTotalDoctors(res.data.totalDoctors); // Tổng số bác sĩ
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching doctor details:", error);
      }
    };

    fetchDoctors();
  }, [currentPage, searchTerm, selectedSpecialization]);

  useEffect(() => {
    const fetchAllDoctors = async () => {
      try {
        const res = await axios.get("/api/user/doctor");
        if (res.data.doctors) {
          setAllDoctors(res.data.doctors);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching doctor details:", error);
      }
    };

    fetchAllDoctors();
  }, []);

  useEffect(() => {
    // khi searchTerm hoặc selectedSpecialization thay đổi, về lại trang đầu
    setCurrentPage(1);
  }, [searchTerm, selectedSpecialization]);

  const specialties = [...new Set(allDoctors.map(doctor => doctor.specialization).filter(Boolean))];

  // Calculate total pages
  const totalPages = Math.ceil(totalDoctors / doctorsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Topbar */}
      <TopBarComponent />

      {/* Hero Carousel */}
      <HeroBanner
        image={DEPT_BANNER}
        title="Đội Ngũ Bác Sĩ KiwiCare"
        subtitle="Những chuyên gia tận tâm vì sức khỏe của bạn"
      />

      {/* Search and Filter Section */}
      <div className="container-fluid py-4">
        <Container>
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên bác sĩ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                <option value="">Tất Cả Chuyên Khoa</option>
                {specialties.map((specialty, index) => (
                  <option key={index} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Team Section */}
      <div className="container-fluid py-5">
        <Container>
          <Row className="g-5">
            <Col lg={4} className="wow fadeInUp" data-wow-delay="0.1s">
              <div className="bg-light rounded h-100 p-5">
                <h5 className="text-primary text-uppercase position-relative d-inline-block">
                  Bác Sĩ KiwiCare
                  <span
                    className="position-absolute top-0 start-0 translate-middle-y bg-primary w-100"
                    style={{ height: "2px" }}
                  ></span>
                </h5>
                <h1 className="display-6 mb-4">Gặp Gỡ Đội Ngũ Bác Sĩ Chuyên Nghiệp</h1>
                <Link to="/appointment" className="btn py-3 px-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#005B99', color: 'white', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <i className="bi bi-calendar3 me-2"></i>
                  ĐẶT LỊCH KHÁM NGAY!
                </Link>
              </div>
            </Col>

            {doctors.map((doctor, index) => (
              <Col
                lg={4}
                key={doctor._id}
                className="wow fadeInUp"
                data-wow-delay={`${(index % 3) * 0.3}s`}
              >
                <div className="team-item">
                  <div className="position-relative rounded-top">
                    <img
                      className="img-fluid rounded-top w-100"
                      src={doctor.avatar}
                      alt={doctor.name ? doctor.name : 'Doctor'}
                    />
                  </div>
                  <div className="team-text position-relative bg-light text-center rounded-bottom p-4 pt-5">
                    <h4 className="mb-2">
                      {doctor.name ? `Bác sĩ ${doctor.name}` : 'Bác sĩ không rõ tên'}
                    </h4>
                    <p className="mb-2">
                      <strong>Chuyên ngành:</strong> {doctor.specialization || 'Không rõ'}
                    </p>
                    <Link to={`/doctor/${doctor._id}`} className="btn btn-primary mt-2">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* Pagination Section */}
      <div className="d-flex justify-content-center py-4">
        <h5 className="text-muted">Tổng số bác sĩ: {totalDoctors}</h5>
      </div>

      <div className="d-flex justify-content-center py-4 align-items-center">
        <button
          className="btn btn-secondary me-2"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </button>
        <span>{`Trang ${currentPage} / ${totalPages}`}</span>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>
    </>
  );
};

export default DoctorPage;