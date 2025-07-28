import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('user');
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const PrivateRouteNotAllowUser = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const isLoggedIn = !!user;
  const payload = decodeToken(token);
const role = payload?.role;

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (role === "patient") return <Navigate to="/not-found" replace />;

  return children;
};
const PrivateRouteByRole = ({ allowedRoles = [], children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) return <Navigate to="/login" replace />;

  const payload = decodeToken(token);
  const role = payload?.role || user?.role || "patient";

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
};
export { PrivateRoute, PrivateRouteNotAllowUser,PrivateRouteByRole };
function decodeToken(token) {
  try {
    const base64Payload = token.split('.')[1]; // Phần payload của JWT
    const payload = atob(base64Payload); // Giải mã base64
    return JSON.parse(payload); // parse JSON
  } catch {
    return null;
  }
}