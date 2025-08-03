import React, { Fragment, useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from "axios";
import '../assets/css/ServicePage.css';
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from '../components/TopBarComponent';

const DEPT_BANNER = "https://xdcs.cdnchinhphu.vn/446259493575335936/2024/1/13/bv-1705119640880430272769.jpg";

const ServiceBox = ({ image, title, description, buttonUrl }) => (
  <div className="servicebox">
    <div className="servicebox-content">
      <div className="servicebox-image-container">
        <img
          src={image}
          alt={title}
          className="servicebox-image"
        />
      </div>
      <h3 className="servicebox-title">{title}</h3>
      <p className="servicebox-desc">{description}</p>
      <Link
        to={buttonUrl}
        className="servicebox-button"
      >
        Tìm Hiểu Thêm
      </Link>
    </div>
  </div>
);

const ServicePage = () => {
  const [services, setServices] = useState([]);
  const [totalServices, setTotalServices] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");  // Lưu trạng thái tìm kiếm
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(3);  // Mặc định 6 dịch vụ mỗi trang

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`/api/user/service?page=${currentPage}&limit=${servicesPerPage}&searchTerm=${searchTerm}`);
        console.log("API Response:", res.data);
        if (Array.isArray(res.data.services)) {
          setServices(res.data.services);
          setTotalServices(res.data.totalServices);  // Tổng số dịch vụ
        } else {
          setServices([]);
        }
      } catch (error) {
        setServices([]);
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, [currentPage, searchTerm]); // Khi currentPage hoặc searchTerm thay đổi, gọi lại API

  useEffect(() => {
    // khi searchTerm thay đổi, về lại trang đầu
    setCurrentPage(1);
  }, [searchTerm]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(totalServices / servicesPerPage);

  // Handle chuyển trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Topbar */}
      <TopBarComponent />
      <Fragment>
        {/* Hero Carousel */}
        <HeroBanner
          image={DEPT_BANNER}
          title="Dịch Vụ Y Tế Vietcare"
          subtitle="Chăm sóc sức khỏe toàn diện với các chuyên khoa hàng đầu"
        />

        <div className="service-section">
          <div className="service-container">
            <div className="service-search-bar">
              <h2 className="service-title">Tra cứu tên dịch vụ</h2>
              <div className="search-row">
                <input
                  className="service-search"
                  placeholder="Nhập tên dịch vụ cần tìm..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="service-grid">
              {services.map((item, index) => (
                <div key={item._id || index} className="service-grid-item">
                  <ServiceBox
                    image={item.image}
                    title={item.name}
                    description={item.description}
                    buttonUrl={`/service/${item._id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Section */}
        <div className="d-flex justify-content-center py-4">
          <h5 className="text-muted">Tổng số dịch vụ: {totalServices}</h5>
        </div>

        <div className="d-flex justify-content-center py-4 align-items-center">
          <button
            className="btn btn-secondary me-2"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </button>

          {/* Chữ trang được căn giữa */}
          <span className="mx-3">{`Trang ${currentPage} / ${totalPages}`}</span>

          <button
            className="btn btn-secondary ms-2"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      </Fragment>
    </>
  );
};

export default ServicePage;