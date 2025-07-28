import React from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import { Outlet } from "react-router-dom";

const DoctorLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <DoctorSidebar />
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

export default DoctorLayout;
