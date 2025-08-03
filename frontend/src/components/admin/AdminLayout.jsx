import React, { useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("1");

  // Map routes to menu keys
  const menuItems = [
    { key: "1", path: "/admin", icon: <DashboardOutlined />, label: "Bảng Điều Khiển" },
    { key: "2", path: "/admin/accounts", icon: <UserOutlined />, label: "Quản Lý Người Dùng" },
    { key: "3", path: "/admin/employees", icon: <TeamOutlined />, label: "Quản Lý Nhân Viên" },
    { key: "4", path: "/admin/attendance", icon: <TeamOutlined />, label: "Quản Lý Điểm Danh" },
    { key: "5", path: "/admin/departments", icon: <AppstoreOutlined />, label: "Quản Lý Khoa" },
    { key: "6", path: "/admin/services", icon: <AppstoreOutlined />, label: "Quản Lý Dịch Vụ" },
    { key: "7", path: "/admin/blogs", icon: <FileTextOutlined />, label: "Quản Lý Bài Viết" },
    { key: "8", path: null, icon: <LogoutOutlined />, label: "Đăng Xuất", onClick: () => handleLogout() },
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
          {collapsed ? "KC" : "Admin"}
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

export default AdminLayout;