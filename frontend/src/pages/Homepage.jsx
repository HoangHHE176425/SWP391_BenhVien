import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import MilestoneSection from "../components/MilestoneSection";
import "../assets/css/HomePage.css";

const HomePage = () => {
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState(0); // Separate index for services
  const [carouselIndex, setCarouselIndex] = useState(0); // Index for departments
  const [blogCarouselIndex, setBlogCarouselIndex] = useState(0);
  const [newsCarouselIndex, setNewsCarouselIndex] = useState(0);
  const [topViewedBlogs, setTopViewedBlogs] = useState([]);
  const [prioritizedNews, setPrioritizedNews] = useState([]);
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Truncate text for titles and excerpts
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

  // Get content summary for blogs
  const getBlogContentSummary = (content) => {
    if (!Array.isArray(content) || content.length === 0)
      return "Không có nội dung";
    const firstItem = content[0];
    return truncateText(firstItem.text, 50);
  };

  // Get content summary for news
  const getNewsContentSummary = (content) => {
    return truncateText(content, 50);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [serviceResponse, departmentResponse, blogResponse, newsResponse] = await Promise.all([
          axios.get(`http://localhost:9999/api/user/service?t=${Date.now()}`, { headers }),
          axios.get(`http://localhost:9999/api/user/department?t=${Date.now()}`, { headers }),
          axios.get(`http://localhost:9999/api/staff/blogs/top-viewed?t=${Date.now()}`, { headers }),
          axios.get(`http://localhost:9999/api/staff/news/priority?t=${Date.now()}`, { headers }),
        ]);

        // Log raw responses for debugging
        console.log("Raw Service Response:", serviceResponse);
        console.log("Raw Department Response:", departmentResponse);
        console.log("Raw Blog Response:", blogResponse);
        console.log("Raw News Response:", newsResponse);

        // Process services
        let serviceData = [];
        if (Array.isArray(serviceResponse.data.data)) {
          serviceData = serviceResponse.data.data;
        } else if (Array.isArray(serviceResponse.data.services)) {
          serviceData = serviceResponse.data.services;
        } else if (Array.isArray(serviceResponse.data)) {
          serviceData = serviceResponse.data;
        }
        console.log("Processed Service Data:", serviceData);
        const mappedServices = serviceData.map((service) => ({
          _id: service._id || service.id || `service-${Math.random()}`,
          title: service.name || service.serviceName || service.title || "Dịch vụ không rõ tên",
          description: service.description || "Không có mô tả",
          image: service.image || "https://via.placeholder.com/150x150",
        }));
        console.log("Mapped Services:", mappedServices);

        // Process departments
        let departmentData = [];
        if (Array.isArray(departmentResponse.data.data)) {
          departmentData = departmentResponse.data.data;
        } else if (Array.isArray(departmentResponse.data.departments)) {
          departmentData = departmentResponse.data.departments;
        } else if (Array.isArray(departmentResponse.data)) {
          departmentData = departmentResponse.data;
        }
        console.log("Processed Department Data:", departmentData);
        const mappedDepartments = departmentData.map((department) => ({
          _id: department._id || department.id || `department-${Math.random()}`,
          name: department.name || "Khoa không rõ tên",
          description: department.description || "Không có mô tả",
          image: department.image || "https://via.placeholder.com/150x150",
        }));
        console.log("Mapped Departments:", mappedDepartments);

        setServices(mappedServices);
        setDepartments(mappedDepartments);
        setTopViewedBlogs(blogResponse.data.data || blogResponse.data || []);
        setPrioritizedNews(newsResponse.data.data || newsResponse.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
            "Không thể tải dữ liệu. Vui lòng kiểm tra API."
        );
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Pagination logic for services
  const getVisibleServices = () => {
    if (!Array.isArray(services) || services.length === 0) return [];
    const itemsPerPage = 4;
    const startIndex = serviceCarouselIndex % services.length;
    const visibleServices = [];
    const maxItems = Math.min(itemsPerPage, services.length);
    for (let i = 0; i < maxItems; i++) {
      const index = (startIndex + i) % services.length;
      visibleServices.push(services[index]);
    }
    return visibleServices;
  };

  const handleServiceNext = () => {
    setServiceCarouselIndex((prevIndex) => prevIndex + 1);
  };

  const handleServicePrev = () => {
    setServiceCarouselIndex((prevIndex) => (prevIndex === 0 ? services.length - 1 : prevIndex - 1));
  };

  // Pagination logic for departments
  const activeDepartments = Array.isArray(departments) ? departments : [];

  const getVisibleDepartments = () => {
    if (!Array.isArray(activeDepartments) || activeDepartments.length === 0) return [];
    const itemsPerPage = 4;
    const startIndex = carouselIndex % activeDepartments.length;
    const visibleDepartments = [];
    const maxItems = Math.min(itemsPerPage, activeDepartments.length);
    for (let i = 0; i < maxItems; i++) {
      const index = (startIndex + i) % activeDepartments.length;
      visibleDepartments.push(activeDepartments[index]);
    }
    return visibleDepartments;
  };

  const handleDepartmentNext = () => {
    setCarouselIndex((prevIndex) => prevIndex + 1);
  };

  const handleDepartmentPrev = () => {
    setCarouselIndex((prevIndex) => (prevIndex === 0 ? activeDepartments.length - 1 : prevIndex - 1));
  };

  // Pagination logic for blogs
  const getVisibleBlogs = () => {
    if (!Array.isArray(topViewedBlogs) || topViewedBlogs.length === 0) return [];
    const itemsPerPage = 4;
    const startIndex = blogCarouselIndex % topViewedBlogs.length;
    const visibleBlogs = [];
    const maxItems = Math.min(itemsPerPage, topViewedBlogs.length);
    for (let i = 0; i < maxItems; i++) {
      const index = (startIndex + i) % topViewedBlogs.length;
      visibleBlogs.push(topViewedBlogs[index]);
    }
    return visibleBlogs;
  };

  const handleBlogNext = () => {
    setBlogCarouselIndex((prevIndex) => prevIndex + 1);
  };

  const handleBlogPrev = () => {
    setBlogCarouselIndex((prevIndex) => (prevIndex === 0 ? topViewedBlogs.length - 1 : prevIndex - 1));
  };

  // Pagination logic for news
  const getVisibleNews = () => {
    if (!Array.isArray(prioritizedNews) || prioritizedNews.length === 0) return [];
    const itemsPerPage = 4;
    const startIndex = newsCarouselIndex % prioritizedNews.length;
    const visibleNews = [];
    const maxItems = Math.min(itemsPerPage, prioritizedNews.length);
    for (let i = 0; i < maxItems; i++) {
      const index = (startIndex + i) % prioritizedNews.length;
      visibleNews.push(prioritizedNews[index]);
    }
    return visibleNews;
  };

  const handleNewsNext = () => {
    setNewsCarouselIndex((prevIndex) => prevIndex + 1);
  };

  const handleNewsPrev = () => {
    setNewsCarouselIndex((prevIndex) => (prevIndex === 0 ? prioritizedNews.length - 1 : prevIndex - 1));
  };

  if (loading) {
    return <div className="homepage-loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="homepage-error">Lỗi: {error}</div>;
  }

  return (
    <>
      {/* Topbar */}
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

      {/* Hero Carousel */}
      <div
        id="heroCarousel"
        className="carousel slide carousel-fade"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d"
              className="d-block w-100"
              alt="KiwiCare Banner"
              style={{ objectFit: "cover", height: "90vh" }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center text-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: "0 15px",
              }}
            >
              <div className="text-white">
                <h5
                  className="text-uppercase fw-semibold mb-3"
                  style={{ letterSpacing: "2px" }}
                >
                  Chăm Sóc Sức Khỏe Toàn Diện
                </h5>
                <h1 className="display-3 fw-bold mb-4">
                  Dịch Vụ Y Tế Chất Lượng Tại KiwiCare
                </h1>
                <div>
                  <Link
                    to="/appointment"
                    className="btn btn-primary btn-lg px-4 me-3 shadow"
                  >
                    Đặt Lịch Hẹn
                  </Link>
                  <Link
                    to="/contact"
                    className="btn btn-outline-light btn-lg px-4 shadow"
                  >
                    Liên Hệ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us */}
      <Container className="py-5">
        <Row className="align-items-center">
          <Col md={6} className="mb-4 mb-md-0">
            <img
              src="https://images.unsplash.com/photo-1579684453423-f84349ef60b0"
              alt="Phòng Khám KiwiCare"
              className="img-fluid rounded shadow-lg"
              style={{ transition: "transform 0.3s ease", transform: "scale(1)" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </Col>
          <Col md={6}>
            <h2 className="text-primary fw-bold mb-3">Phòng Khám Đa Khoa KiwiCare</h2>
            <p className="text-muted mb-4 fs-5">
              Phòng Khám Đa Khoa KiwiCare tự hào là đơn vị cung cấp dịch vụ y tế toàn diện, với đội ngũ bác sĩ được đào tạo tại các trường đại học y khoa hàng đầu trong và ngoài nước. Chúng tôi chuyên cung cấp các dịch vụ đa chuyên khoa như nội khoa, nhi khoa, phụ sản, và phẫu thuật ngoại khoa, đáp ứng tiêu chuẩn y tế quốc tế. Với sứ mệnh mang đến sức khỏe và sự an tâm, KiwiCare cam kết đồng hành cùng bạn trong mọi nhu cầu chăm sóc sức khỏe.
            </p>
          </Col>
        </Row>
      </Container>

      {/* Tiêu chí phòng khám */}
      <MilestoneSection />

      {/* Cơ sở vật chất */}
      <section className="mb-5">
        <h3 className="text-primary mb-4 fw-bold text-center">Cơ Sở Vật Chất</h3>
        <div id="facilityCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="3000">
          <div className="carousel-indicators">
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="0"
              className="active"
              aria-current="true"
              aria-label="Slide 1"
            ></button>
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="1"
              aria-label="Slide 2"
            ></button>
            <button
              type="button"
              data-bs-target="#facilityCarousel"
              data-bs-slide-to="2"
              aria-label="Slide 3"
            ></button>
          </div>
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img
                src="https://benhvienungbuoukhanhhoa.vn/uploads/news/2023_05/he-thong-chup-clvt.jpg"
                className="d-block w-100"
                alt="Máy chụp CT"
                style={{ objectFit: "cover", height: "50vh", borderRadius: "8px" }}
              />
              <div
                className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  position: "absolute",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h4 className="text-white fw-bold mb-3">Hệ Thống Chẩn Đoán Hình Ảnh</h4>
                <p className="text-white text-center fs-6">
                  Máy chụp CT và MRI tiên tiến, hỗ trợ chẩn đoán chính xác và nhanh chóng.
                </p>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="https://vietnamcleanroom.com/vcr-media/22/10/22/phong-mo-hien-dai.jpg"
                className="d-block w-100"
                alt="Phòng phẫu thuật"
                style={{ objectFit: "cover", height: "50vh", borderRadius: "8px" }}
              />
              <div
                className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  position: "absolute",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h4 className="text-white fw-bold mb-3">Phòng Phẫu Thuật Hiện Đại</h4>
                <p className="text-white text-center fs-6">
                  Trang bị công nghệ tiên tiến, đáp ứng các ca phẫu thuật phức tạp.
                </p>
              </div>
            </div>
            <div className="carousel-item">
              <img
                src="https://thietbilabhoasinh.com/ckeditor/plugins/fileman/Uploads/tu-an-toan-sinh-hoc-cap-2-xet-nghiem.jpg"
                className="d-block w-100"
                alt="Phòng xét nghiệm"
                style={{ objectFit: "cover", height: "50vh", borderRadius: "8px" }}
              />
              <div
                className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  position: "absolute",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h4 className="text-white fw-bold mb-3">Phòng Xét Nghiệm</h4>
                <p className="text-white text-center fs-6">
                  Hệ thống xét nghiệm tự động, đảm bảo kết quả nhanh chóng và chính xác.
                </p>
              </div>
            </div>
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#facilityCarousel"
            data-bs-slide="prev"
          >
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#facilityCarousel"
            data-bs-slide="next"
          >
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </section>

      {/* Priority News Section */}
      <Container fluid className="bg-light py-5">
        <Container>
          <h2 className="text-center text-primary fw-bold mb-5">Tin Tức Phòng Khám</h2>
          {prioritizedNews.length === 0 ? (
            <p className="text-center text-muted">Không có tin tức nào để hiển thị.</p>
          ) : prioritizedNews.length <= 4 ? (
            <Row>
              {prioritizedNews.map((news, index) => (
                <Col key={index} md={6} lg={3} className="mb-4">
                  <div className="news-card bg-white rounded shadow h-100">
                    <Link to={`/news/${news.slug}`}>
                      <img
                        src={news.thumbnail || "https://via.placeholder.com/150x150"}
                        alt={news.title}
                        className="news-image img-fluid w-100"
                        style={{ height: "150px", objectFit: "cover" }}
                        onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                      />
                    </Link>
                    <div className="p-3 d-flex flex-column justify-content-between h-100">
                      <div>
                        <Link
                          to={`/news/${news.slug}`}
                          className="text-decoration-none"
                        >
                          <h5 className="news-title mb-2">
                            {truncateText(news.title, 20)}
                          </h5>
                        </Link>
                        <p className="news-excerpt text-muted mb-2">
                          {getNewsContentSummary(news.content)}
                        </p>
                      </div>
                      <Link
                        to={`/news/${news.slug}`}
                        className="btn btn-outline-primary btn-sm mt-auto"
                      >
                        Đọc bài viết
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="news-carousel">
              <Row className="flex-nowrap news-carousel-inner">
                {getVisibleNews().map((news, index) => (
                  <Col key={index} md={6} lg={3} className="mb-4">
                    <div className="news-card bg-white rounded shadow h-100">
                      <Link to={`/news/${news.slug}`}>
                        <img
                          src={news.thumbnail || "https://via.placeholder.com/150x150"}
                          alt={news.title}
                          className="news-image img-fluid w-100"
                          style={{ height: "150px", objectFit: "cover" }}
                          onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                        />
                      </Link>
                      <div className="p-3 d-flex flex-column justify-content-between h-100">
                        <div>
                          <Link
                            to={`/news/${news.slug}`}
                            className="text-decoration-none"
                          >
                            <h5 className="news-title mb-2">
                              {truncateText(news.title, 20)}
                            </h5>
                          </Link>
                          <p className="news-excerpt text-muted mb-2">
                            {getNewsContentSummary(news.content)}
                          </p>
                        </div>
                        <Link
                          to={`/news/${news.slug}`}
                          className="btn btn-outline-primary btn-sm mt-auto"
                        >
                          Đọc bài viết
                        </Link>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <button
                className="carousel-control-prev"
                type="button"
                onClick={handleNewsPrev}
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                onClick={handleNewsNext}
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          )}
        </Container>
      </Container>

      {/* Most Viewed Blogs Section */}
      <Container className="py-5">
        <h2 className="text-center text-primary fw-bold mb-5">Bài Viết Nổi Bật</h2>
        {topViewedBlogs.length === 0 ? (
          <p className="text-center text-muted">Không có bài viết nào để hiển thị.</p>
        ) : topViewedBlogs.length <= 4 ? (
          <Row>
            {topViewedBlogs.map((blog, index) => (
              <Col key={index} md={6} lg={3} className="mb-4">
                <div className="blog-card bg-white rounded shadow h-100">
                  <Link to={`/blog/${blog.slug}`}>
                    <img
                      src={blog.image || "https://via.placeholder.com/150x150"}
                      alt={blog.title}
                      className="blog-image img-fluid w-100"
                      style={{ height: "150px", objectFit: "cover" }}
                      onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                    />
                  </Link>
                  <div className="p-3 d-flex flex-column justify-content-between h-100">
                    <div>
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="text-decoration-none"
                      >
                        <h5 className="blog-title mb-2">
                          {truncateText(blog.title, 20)}
                        </h5>
                      </Link>
                      <p className="blog-excerpt text-muted mb-2">
                        {getBlogContentSummary(blog.content)}
                      </p>
                    </div>
                    <Link
                      to={`/blog/${blog.slug}`}
                      className="btn btn-outline-primary btn-sm mt-auto"
                    >
                      Đọc bài viết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="blogs-carousel">
            <Row className="flex-nowrap blogs-carousel-inner">
              {getVisibleBlogs().map((blog, index) => (
                <Col key={index} md={6} lg={3} className="mb-4">
                  <div className="blog-card bg-white rounded shadow h-100">
                    <Link to={`/blog/${blog.slug}`}>
                      <img
                        src={blog.image || "https://via.placeholder.com/150x150"}
                        alt={blog.title}
                        className="blog-image img-fluid w-100"
                        style={{ height: "150px", objectFit: "cover" }}
                        onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                      />
                    </Link>
                    <div className="p-3 d-flex flex-column justify-content-between h-100">
                      <div>
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="text-decoration-none"
                        >
                          <h5 className="blog-title mb-2">
                            {truncateText(blog.title, 20)}
                          </h5>
                        </Link>
                        <p className="blog-excerpt text-muted mb-2">
                          {getBlogContentSummary(blog.content)}
                        </p>
                      </div>
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="btn btn-outline-primary btn-sm mt-auto"
                      >
                        Đọc bài viết
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <button
              className="carousel-control-prev"
              type="button"
              onClick={handleBlogPrev}
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              onClick={handleBlogNext}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        )}
      </Container>

      {/* Departments Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4 fw-bold text-primary">Chuyên Khoa</h2>
        {activeDepartments.length === 0 ? (
          <p className="text-center text-muted">Không có chuyên khoa nào để hiển thị.</p>
        ) : activeDepartments.length <= 4 ? (
          <Row>
            {activeDepartments.map((department) => (
              <Col key={department._id} md={6} lg={3} className="mb-4">
                <div className="department-card bg-white rounded shadow h-100">
                  <Link to={`/department/${department._id}`}>
                    <img
                      src={department.image || "https://via.placeholder.com/150x150"}
                      alt={department.name}
                      className="img-fluid w-100"
                      style={{ height: "150px", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                      onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                    />
                  </Link>
                  <div className="p-3 d-flex flex-column justify-content-between h-100">
                    <div className="text-center">
                      <h5 className="mb-1">{department.name}</h5>
                      <p className="text-muted mb-2">{department.description}</p>
                    </div>
                    <Link
                      to={`/department/${department._id}`}
                      className="btn btn-outline-primary btn-sm mt-auto text-center"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="departments-carousel">
            <Row className="flex-nowrap departments-carousel-inner">
              {getVisibleDepartments().map((department) => (
                <Col key={department._id} md={6} lg={3} className="mb-4">
                  <div className="department-card bg-white rounded shadow h-100">
                    <Link to={`/department/${department._id}`}>
                      <img
                        src={department.image || "https://via.placeholder.com/150x150"}
                        alt={department.name}
                        className="img-fluid w-100"
                        style={{ height: "150px", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                        onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                      />
                    </Link>
                    <div className="p-3 d-flex flex-column justify-content-between h-100">
                      <div className="text-center">
                        <h5 className="mb-1">{department.name}</h5>
                        <p className="text-muted mb-2">{department.description}</p>
                      </div>
                      <Link
                        to={`/department/${department._id}`}
                        className="btn btn-outline-primary btn-sm mt-auto text-center"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <button
              className="carousel-control-prev"
              type="button"
              onClick={handleDepartmentPrev}
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              onClick={handleDepartmentNext}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        )}
      </Container>

      {/* Services Section */}
      <Container fluid className="bg-light py-5">
        <Container>
          <h2 className="text-center text-primary fw-bold mb-5">Các Loại Dịch Vụ</h2>
          {services.length === 0 ? (
            <p className="text-center text-muted">Không có dịch vụ nào để hiển thị.</p>
          ) : services.length <= 4 ? (
            <Row>
              {services.map((service) => (
                <Col key={service._id} md={6} lg={3} className="mb-4">
                  <div className="service-card bg-white rounded shadow h-100">
                    <Link to={`/service/${service._id}`}>
                      <img
                        src={service.image || "https://via.placeholder.com/150x150"}
                        alt={service.title}
                        className="img-fluid w-100"
                        style={{ height: "150px", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                        onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                      />
                    </Link>
                    <div className="p-3 d-flex flex-column justify-content-between h-100">
                      <div className="text-center">
                        <h5 className="mb-1">{service.title}</h5>
                        <p className="text-muted mb-2">{service.description}</p>
                      </div>
                      <Link
                        to={`/service/${service._id}`}
                        className="btn btn-outline-primary btn-sm mt-auto text-center"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="services-carousel">
              <Row className="flex-nowrap services-carousel-inner">
                {getVisibleServices().map((service) => (
                  <Col key={service._id} md={6} lg={3} className="mb-4">
                    <div className="service-card bg-white rounded shadow h-100">
                      <Link to={`/service/${service._id}`}>
                        <img
                          src={service.image || "https://via.placeholder.com/150x150"}
                          alt={service.title}
                          className="img-fluid w-100"
                          style={{ height: "150px", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                          onError={(e) => (e.target.src = "https://via.placeholder.com/150x150")}
                        />
                      </Link>
                      <div className="p-3 d-flex flex-column justify-content-between h-100">
                        <div className="text-center">
                          <h5 className="mb-1">{service.title}</h5>
                          <p className="text-muted mb-2">{service.description}</p>
                        </div>
                        <Link
                          to={`/service/${service._id}`}
                          className="btn btn-outline-primary btn-sm mt-auto text-center"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <button
                className="carousel-control-prev"
                type="button"
                onClick={handleServicePrev}
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                onClick={handleServiceNext}
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          )}
        </Container>
      </Container>
    </>
  );
};

export default HomePage;