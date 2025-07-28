import React from "react";
import HrmanagerSidebar from "../components/hrmanager/hrmanagerSidebar"; // ✅ đúng tên file và viết hoa đúng chuẩn
import { Outlet } from "react-router-dom";

const HrmanagerLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <HrmanagerSidebar />
      <main
        style={{
          flex: 1,
          padding: "24px",
          paddingTop: "100px", // tránh bị che bởi header
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default HrmanagerLayout;
