import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "../assets/css/Homepage.css";
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from "../components/TopBarComponent";

const DEPT_BANNER = "https://images.unsplash.com/photo-1579684453423-f84349ef60b0";

const DoctorDetail = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`/api/user/doctor/${doctorId}`);
        console.log("API Response:", res.data);
        if (res.data.doctor) {
          setDoctor(res.data.doctor);
        } else if (res.data) {
          setDoctor(res.data);
        } else {
          throw new Error("Invalid response format");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching doctor details:", error);
        setError("Failed to load doctor details. Please check the console for more details.");
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

  //   const doctors = [
  //   {
  //     _id: "1",
  //     userId: { fullname: "Nguyễn Văn An" },
  //     ProfileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
  //     Specialty: "Nội Tổng Quát",
  //   },
  //   {
  //     _id: "2",
  //     userId: { fullname: "Trần Thị Bình" },
  //     ProfileImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f",
  //     Specialty: "Nhi Khoa",
  //   },
  //   {
  //     _id: "3",
  //     userId: { fullname: "Lê Minh Châu" },
  //     ProfileImage: "https://images.unsplash.com/photo-1598257006626-48b0c252070d",
  //     Specialty: "Phụ Sản",
  //   },
  //   {
  //     _id: "4",
  //     userId: { fullname: "Phạm Quốc Đạt" },
  //     ProfileImage: "https://images.unsplash.com/photo-1622253692010-333f2b7c2f96",
  //     Specialty: "Ngoại Khoa",
  //   },
  //   {
  //     _id: "5",
  //     userId: { fullname: "Hoàng Thị Mai" },
  //     ProfileImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f",
  //     Specialty: "Chẩn Đoán Hình Ảnh",
  //   },
  // ];

  //   useEffect(() => {
  //     const fetchDoctor = async () => {
  //       try {
  //         console.log(`Fetching doctor with ID: ${doctorId}`);
  //         const doctor1 = doctors.find(dt => dt._id == doctorId);
  //         setDoctor(doctor1);
  //         setLoading(false);
  //       } catch (error) {
  //         console.error("Error fetching doctor details:", error);
  //         setError("Failed to load doctor details. Please check the console for more details.");
  //         setLoading(false);
  //       }
  //     };

  //     fetchDoctor();
  //     console.log(JSON.stringify(doctor));
  //   }, [doctorId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <h3>Loading...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <h3>{error}</h3>
        <Link to="/doctor-home" className="btn btn-primary mt-3">Back to Doctor Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Topbar */}
      <TopBarComponent />



      {/* Hero Carousel */}
      <HeroBanner
        image={DEPT_BANNER}
        title="Đội Ngũ Bác Sĩ Vietcare"
        subtitle="Những chuyên gia tận tâm vì sức khỏe của bạn"
      />

      {/* Doctor Details Section */}
      <div className="container-fluid py-5">
        <Container>
          <Row className="g-5">
            <Col lg={6} className="wow fadeInUp" data-wow-delay="0.1s">
              <div className="bg-light rounded p-5 h-100 d-flex align-items-center justify-content-center">
                <img
                  className="img-fluid rounded"
                  src={doctor.avatar}
                  alt={doctor.degree}
                  style={{ maxHeight: "100%", width: "100%", objectFit: "cover" }}
                />
              </div>
            </Col>
            <Col lg={6} className="wow fadeInUp" data-wow-delay="0.3s">
              <div className="bg-light rounded p-5 h-100">
                <h2 className="mb-4">Doctor Details</h2>
                <p><strong>Tên:</strong> {doctor.name}</p>
                <p><strong>Chuyên ngành:</strong> {doctor.specialization}</p>
                <p><strong>Bằng cấp:</strong> {doctor.degree}</p>
                <p><strong>Năm kinh nghiệm:</strong> {doctor.expYear}</p>
                <p><strong>Mô tả:</strong> {doctor.description}</p>
                <p><strong>Tình trạng:</strong> {doctor.status}</p>
                <Link to="/doctor-home" className="btn btn-secondary mt-3">Back to Doctor Home</Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default DoctorDetail;