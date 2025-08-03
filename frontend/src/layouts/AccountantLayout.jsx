import React from "react";
import AccountantSidebar from "../components/accountant/AccountantSidebar";
import { Outlet } from "react-router-dom";

const AccountantLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <AccountantSidebar />
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

export default AccountantLayout;
