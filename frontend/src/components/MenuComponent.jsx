import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  CloseOutlined,
  FileTextOutlined,
  HeartOutlined,
  BookOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileDoneOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

const DRAWER_WIDTH = 240;

// Define menu dynamically based on role
const menuByRole = (role) => {
  const menus = {
    patient: [
      { title: "Quản Lý Hồ Sơ", path: "/profilemanage", icon: <UserOutlined /> },
      { title: "Lịch hẹn của tôi", path: "/myappointments", icon: <CalendarOutlined /> },
      { title: "Foods", path: "/health/food", icon: <HeartOutlined /> },
      { title: "BMI", path: "/health/calculator", icon: <FileTextOutlined /> },
      { title: "Q/A", path: "/qa", icon: <BookOutlined /> },
      { title: "Lịch Sử Q/A", path: "/qahistory", icon: <ClockCircleOutlined /> },
      { title: "Hóa đơn", path: "/invoice", icon: <DollarOutlined /> },
      { title: "FAQ", path: "/faq", icon: <QuestionCircleOutlined /> },
    ],
  };

  return menus[role] || [];
};

const MenuComponent = ({ isOpen, onClose, role }) => {
  const location = useLocation();
  const navigations = menuByRole(role);

  return (
    <Drawer
      title={null}
      placement="left"
      onClose={onClose}
      open={isOpen}
      closeIcon={<CloseOutlined style={{ fontSize: 20 }} />}
      width={DRAWER_WIDTH}
      style={{ top: 70 }}
      mask={false}
      styles={{
        body: {
          scrollbarWidth: "thin",
          msOverflowStyle: "auto",
          overflowY: "hidden", // Prevent default scrollbar on body
        },
      }}
      className="custom-drawer"
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          minHeight: "100%",
          height: "calc(100vh - 70px)",
          overflowY: "auto", // Single scrollbar for nav content
          paddingTop: 4,
          paddingBottom: 4,
          width: "100%",
        }}
      >
        {navigations.map(({ title, path, icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={title}
              to={path}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 28px",
                fontSize: "16px",
                color: isActive ? "#1890ff" : "#333",
                textDecoration: "none",
                borderRadius: "0 24px 24px 0",
                background: isActive ? "#e6f7ff" : "transparent",
                fontWeight: isActive ? 600 : 400,
                margin: "2px 0",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
                width: "100%", // Ensure full width
              }}
            >
              {React.cloneElement(icon, { style: { fontSize: 20 } })}
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>
    </Drawer>
  );
};

export default MenuComponent;