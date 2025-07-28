import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const DoctorSidebar = () => {
  const navigate = useNavigate();

  const links = [
    { to: "/doctor/medical-profile", label: "Hồ Sơ Y Tế Người Dùng", icon: <UserOutlined /> },
    { to: "/doctor/labtest", label: "Xét Nghiệm", icon: <ScheduleOutlined /> },
    { to: "/doctor/medicine", label: "Xem Thuốc", icon: <MedicineBoxOutlined /> },
    { to: "/doctor/appointments", label: "Xem Lịch Hẹn", icon: <CalendarOutlined /> },
    { to: "/doctor/work-schedule", label: "Xem Lịch Làm Việc", icon: <ScheduleOutlined /> },
    { to: "/doctor/profile", label: "Xem Hồ Sơ Cá Nhân", icon: <ScheduleOutlined /> },
    { to: "/doctor/attendance", label: "Điểm Danh", icon: <ScheduleOutlined /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear user from localStorage
    localStorage.removeItem("token"); // Clear token from localStorage
    navigate("/login");
    window.location.reload(); // Force reload to update Header
  };

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Kế toán</h2>

      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            ...styles.link,
            backgroundColor: isActive ? "#1677ff" : "transparent",
            color: isActive ? "#fff" : "#ddd",
          })}
        >
          <span style={styles.icon}>{icon}</span>
          {label}
        </NavLink>
      ))}

      {/* Nút Logout được đưa vào ngay sau Attendance */}
      <div
        onClick={handleLogout}
        style={{
          ...styles.link,
          cursor: "pointer",
          color: "#ddd",
        }}
      >
        <span style={styles.icon}><LogoutOutlined /></span>
        Đăng Xuất
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: 240,
    minHeight: "100vh",
    backgroundColor: "#001529",
    padding: "20px 10px",
    boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  link: {
    display: "flex",
    alignItems: "center",
    padding: "10px 15px",
    marginBottom: "10px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: 14,
    transition: "0.3s",
  },
  icon: {
    marginRight: 12,
    fontSize: 16,
  },
};

export default DoctorSidebar;