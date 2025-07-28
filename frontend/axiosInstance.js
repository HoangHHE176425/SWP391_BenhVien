import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:9999/", // qua proxy Vite
});

// Thêm interceptor để gắn token vào mỗi request:
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // lấy từ localStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;