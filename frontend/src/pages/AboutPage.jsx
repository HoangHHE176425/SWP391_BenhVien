import React from 'react';
import HeaderComponent from "../components/HeaderComponent";
import FooterComponent from "../components/FooterComponent";
import MilestoneSection from "../components/MilestoneSection";
import { Row, Col } from "react-bootstrap";

const AboutPage = () => {
  return (
    <>
      {/* Topbar */}
      <div className="bg-light py-3 px-5 d-none d-lg-block border-bottom shadow-sm">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small className="text-muted">
              <i className="far fa-clock text-primary me-2"></i>
              Opening Hours: Mon - Sat : 7.00 am - 8.00 pm, Sunday 9.00 am - 5.00 pm
            </small>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted me-4">
              <i className="fa fa-envelope-open text-primary me-2"></i>
              contact@Vietcare.com
            </small>
            <small className="text-muted">
              <i className="fa fa-phone-alt text-primary me-2"></i>
              +987 654 3210
            </small>
          </Col>
        </Row>
      </div>

      {/* Hero Section */}
      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="4000">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d"
              className="d-block w-100"
              alt="Vietcare Banner"
              style={{ objectFit: 'cover', height: '80vh', borderRadius: '8px' }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                position: 'absolute',
                borderRadius: '8px'
              }}
            >
              <h1 className="display-3 fw-bold text-white mb-3">Giới Thiệu Phòng Khám Vietcare</h1>
              <p className="text-white fs-5">Chăm sóc sức khỏe toàn diện với dịch vụ y tế đa chuyên khoa chất lượng cao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Giới thiệu nội dung */}
      <div className="container py-5">

        {/* Section 1 - Giới thiệu + ảnh */}
        <section className="mb-5">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <img
                src="https://images.unsplash.com/photo-1579684453423-f84349ef60b0"
                alt="Phòng Khám Vietcare"
                className="img-fluid rounded shadow-lg"
                style={{ transition: 'transform 0.3s ease', transform: 'scale(1)' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
            <div className="col-md-6">
              <h2 className="text-primary fw-bold mb-3">Phòng Khám Đa Khoa Vietcare</h2>
              <p className="text-muted mb-4 fs-5">
                Thành lập vào năm 2018, Vietcare cam kết mang đến dịch vụ y tế toàn diện với các giá trị cốt lõi: chuyên nghiệp – tận tâm – hiện đại. Đội ngũ bác sĩ tại Vietcare được đào tạo bài bản tại các trường đại học y khoa uy tín như Đại học Y Dược TP. Hồ Chí Minh, Đại học Y Hà Nội, và các tổ chức quốc tế. Với kinh nghiệm phong phú và tinh thần không ngừng đổi mới, chúng tôi đảm bảo mang đến sự an tâm và hài lòng cho mọi bệnh nhân.
              </p>
              <div className="row text-primary fw-semibold">
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Khám nội tổng quát</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Nhi khoa</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Phụ sản</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Chẩn đoán hình ảnh</div>
                <div className="col-6 mb-3"><i className="fa fa-check-circle text-primary me-2"></i>Phẫu thuật ngoại khoa</div>
              </div>
            </div>
          </div>
        </section>

        <MilestoneSection />

        {/* Section 2 - Cơ sở vật chất */}
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
                  src="https://images.unsplash.com/photo-1584982751601-97dcc096659c"
                  className="d-block w-100"
                  alt="Máy chụp CT"
                  style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
                />
                <div
                  className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    borderRadius: '8px',
                    padding: '20px'
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
                  src="https://vietnamcleanroom.com/vcr-media/22/10/22/phong-phau-thuat.jpg"
                  className="d-block w-100"
                  alt="Phòng phẫu thuật"
                  style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
                />
                <div
                  className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    borderRadius: '8px',
                    padding: '20px'
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
                  src="https://images.unsplash.com/photo-1538108149393-fbbd81895907"
                  className="d-block w-100"
                  alt="Phòng xét nghiệm"
                  style={{ objectFit: 'cover', height: '50vh', borderRadius: '8px' }}
                />
                <div
                  className="carousel-caption d-flex flex-column justify-content-center align-items-center"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    borderRadius: '8px',
                    padding: '20px'
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

        {/* Section 3 - Cam Kết */}
        <section className="mb-5">
          <h3 className="text-primary mb-4 fw-bold text-center">Cam Kết Dịch Vụ</h3>
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-check-circle fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Chất Lượng Y Tế</h5>
                <p className="text-muted fs-6">Đảm bảo quy trình khám chữa bệnh đạt chuẩn quốc tế, an toàn và hiệu quả.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-smile-beam fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Tận Tâm Phục Vụ</h5>
                <p className="text-muted fs-6">Đặt bệnh nhân làm trung tâm, phục vụ với sự chu đáo và chuyên nghiệp.</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="p-4 rounded shadow-sm bg-light" style={{ transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="fa fa-tools fa-2x text-primary mb-3"></i>
                <h5 className="fw-bold text-primary">Công Nghệ Tiên Tiến</h5>
                <p className="text-muted fs-6">Ứng dụng trang thiết bị hiện đại để nâng cao chất lượng khám chữa bệnh.</p>
              </div>
            </div>
          </div>
        </section>
      </div>


    </>
  );
};

export default AboutPage;