import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  CalendarOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  HistoryOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const AccountantSidebar = () => {
  const navigate = useNavigate();

  const links = [
    {
      to: "/accountant/profile",
      label: "Xem Hồ Sơ Cá Nhân",
      icon: <UserOutlined />,
    },

    {
      to: "/accountant/medicine-check",
      label: "Kiểm Thuốc",
      icon: <CheckCircleOutlined />,
    },
    {
      to: "/accountant/medicine-management",
      label: "Quản Lý Thuốc",
      icon: <MedicineBoxOutlined />,
    },
    {
      to: "/accountant/transactions",
      label: "Lịch Sử Giao Dịch",
      icon: <HistoryOutlined />,
    },
    {
      to: "/accountant/reports",
      label: "Báo Cáo",
      icon: <FileTextOutlined />,
    },
    {
      to: "/accountant/statistics",
      label: "Thống Kê",
      icon: <BarChartOutlined />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Kế Toán</h2>

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

      <div
        onClick={handleLogout}
        style={{
          ...styles.link,
          cursor: "pointer",
          color: "#ddd",
        }}
      >
        <span style={styles.icon}>
          <LogoutOutlined />
        </span>
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

export default AccountantSidebar;
