import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../assets/css/DepartmentPage.css";
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from "../components/TopBarComponent";

const DEPT_BANNER = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=1600&q=80";

const DepartmentBox = ({ name, description, image, buttonUrl }) => (
  <div className="departmentbox">
    <div className="departmentbox-content">
      <div className="departmentbox-image-container">
        <img
          src={image}
          alt={name}
          className="departmentbox-image"
        />
      </div>
      <h3 className="departmentbox-title">{name}</h3>
      <p className="departmentbox-desc">{description}</p>
      <Link to={buttonUrl} className="departmentbox-button">Xem chi tiết</Link>
    </div>
  </div>
);

const DepartmentPage = () => {
  const [departments, setDepartments] = useState([]);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentsPerPage] = useState(3);  // Mặc định 6 phòng ban mỗi trang

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`/api/user/department?page=${currentPage}&limit=${departmentsPerPage}&searchTerm=${searchTerm}`);
        console.log("API Response:", res.data);
        if (Array.isArray(res.data.departments)) {
          setDepartments(res.data.departments);
          setTotalDepartments(res.data.totalDepartments);  // Tổng số phòng ban
        } else {
          setDepartments([]);
        }
      } catch (error) {
        setDepartments([]);
        console.error("Error fetching department details:", error);
      }
    };

    fetchDepartments();
  }, [currentPage, searchTerm]); // Khi currentPage thay đổi, sẽ gọi lại API

  useEffect(() => {
    // khi searchTerm thay đổi, về lại trang đầu
    setCurrentPage(1);
  }, [searchTerm]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(totalDepartments / departmentsPerPage);

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
          title="Chuyên Khoa Bệnh Viện"
          subtitle="Danh sách các chuyên khoa – phòng ban – đội ngũ chuyên gia hàng đầu"
        />
        { /* Title */}
        <div className="department-section">
          <div className="department-container">
            <div className="department-search-bar">
              <h2 className="department-title">Tra cứu tên phòng ban</h2>
              <div className="search-row">
                <input
                  className="department-search"
                  placeholder="Nhập tên phòng ban cần tìm..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="department-grid">
              {departments.map((item, index) => (
                <div key={item._id || index} className="department-grid-item">
                  <DepartmentBox
                    name={item.name}
                    description={item.description}
                    image={item.image}
                    buttonUrl={`/department/${item._id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Section */}
        <div className="d-flex justify-content-center py-4">
          <h5 className="text-muted">Tổng số phòng ban: {totalDepartments}</h5>
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

export default DepartmentPage;
