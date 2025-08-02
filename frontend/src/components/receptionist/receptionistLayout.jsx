import React, { useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import {
  FileTextOutlined,
  AppstoreOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  CommentOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
  BellOutlined,
  UserOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const ReceptionistLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("1");

  // Map routes to menu keys
  const menuItems = [
    { key: "1", path: "/receptionist/blogs", icon: <FileTextOutlined />, label: "Quản Lý Bài Viết" },
    { key: "2", path: "/receptionist/services", icon: <AppstoreOutlined />, label: "Quản Lý Dịch Vụ" },
    { key: "3", path: "/receptionist/departments", icon: <AppstoreOutlined />, label: "Quản Lý Khoa" },
    { key: "6", path: "/receptionist/appointments", icon: <CalendarOutlined />, label: "Lịch Hẹn" },
    { key: "19", path: "/receptionist/queue", icon: <CalendarOutlined />, label: "Danh Sách Phòng Khám" },
    { key: "7", path: "/receptionist/notifications", icon: <BellOutlined />, label: "Quản Lý Thông Báo" },
    { key: "8", path: "/receptionist/users", icon: <UserOutlined />, label: "Quản Lý Người Dùng" },
    { key: "9", path: "/receptionist/medicalrecord", icon: <FileTextOutlined />, label: "Hồ Sơ Y Tế" },
    { key: "10", path: "/receptionist/medicines", icon: <PlusCircleOutlined />, label: "Quản Lý Thuốc" },
    { key: "11", path: "/receptionist/invoices", icon: <DollarOutlined />, label: "Quản Lý Hóa Đơn" },
    { key: "12", path: "/receptionist/payments", icon: <DollarOutlined />, label: "Quản Lý Thanh Toán" },
    { key: "13", path: "/receptionist/news", icon: <NotificationOutlined />, label: "Quản Lý Tin Tức" },
    { key: "14", path: "/receptionist/feedback", icon: <CommentOutlined />, label: "Quản Lý Feedback" },
    { key: "15", path: "/receptionist/qna", icon: <QuestionCircleOutlined />, label: "Q/A" },
    { key: "16", path: "/receptionist/schedule", icon: <QuestionCircleOutlined />, label: "Quản Lý Lịch Làm Việc" },
    { key: "18", path: "/receptionist/profile", icon: <QuestionCircleOutlined />, label: "Hồ Sơ Cá Nhân" },
    { key: "17", path: null, icon: <LogoutOutlined />, label: "Đăng Xuất", onClick: () => handleLogout() },
  ];

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload(); // Force reload to update Header
  };

  // Update selected key based on current route
  useEffect(() => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    if (currentItem && currentItem.key !== selectedKey) {
      setSelectedKey(currentItem.key);
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          {collapsed ? "KC" : "Lễ tân"}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}>
          {menuItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick || undefined}>
              {item.path ? <Link to={item.path}>{item.label}</Link> : item.label}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 16,
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, cursor: "pointer" }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Header>
        <Content
          style={{ margin: "24px 16px", padding: 24, background: "#fff" }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReceptionistLayout;