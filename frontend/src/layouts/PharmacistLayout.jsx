import React from "react";
import PharmacistSidebar from "../components/pharmacist/PharmacistSidebar"; // ✅ Đổi đúng tên file
import { Outlet } from "react-router-dom";

const PharmacistLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <PharmacistSidebar />
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

export default PharmacistLayout;
