import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../assets/css/Login.css";
import { Modal } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:9999/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful, user data:", data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        
        // if (data.incompleteProfile && data.missingFields?.length > 0) {
        //   Modal.warning({
        //     title: "Thiếu thông tin hồ sơ",
        //     content: `Bạn cần cập nhật các trường sau: ${data.missingFields.join(
        //       ", "
        //     )}`,
        //     // onOk: () => {
        //     //   navigate("/doctor/profile");
        //     // },
        //   });
        // }

        // Cập nhật context
        login(data.user, data.token);

        // Điều hướng
        setTimeout(() => navigate("/"), 0);
      } else {
        if (response.status === 403) {
          Modal.warning({
            title: "Tài khoản bị khóa",
            content:
              "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ. Gửi email tới: abc@gmail.com",
          });
        } else {
          Modal.error({
            title: "Đăng nhập thất bại",
            content: data.message || "Có lỗi xảy ra. Vui lòng thử lại.",
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginWrapper">
        {/* Phần bên trái - Hình ảnh mô tả */}
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <img
              src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/08763c148032171.62ce0e981e54f.jpg"
              alt="Hình ảnh minh họa"
              className="loginImage"
            />
          </div>
        </div>

        {/* Phần bên phải - Form đăng nhập */}
        <div className="loginFormContainer">
          <h2 className="loginTitle">ĐĂNG NHẬP</h2>
          <form onSubmit={handleSubmit} className="loginForm">
            <div className="formGroup">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="password" className="label">
                Mật Khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                />
                {showPassword ? (
  <EyeInvisibleOutlined
    onClick={() => setShowPassword(false)}
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: 18,
      color: "#555",
    }}
  />
) : (
  <EyeOutlined
    onClick={() => setShowPassword(true)}
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: 18,
      color: "#555",
    }}
  />
)}

              </div>
            </div>

            <div className="forgotPasswordLink">
              <a href="/forgot-password">Bạn quên mật khẩu ?</a>
            </div>
            <button type="submit" className="loginButton">
              Đăng Nhập
            </button>
                      <div className="signupLink">
            Bạn Chưa Có Tài Khoản? <a href="/register">Đăng Ký</a>
          </div>
          </form>
<div style={{ textAlign: "center", marginTop: 20 }}>
  <p>Hoặc đăng nhập bằng Google:</p>
  <GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential); // ✅

      const res = await fetch("http://localhost:9999/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        login(data.user, data.token);
        navigate("/");
      } else {
        Modal.error({
          title: "Đăng nhập bằng Google thất bại",
          content: data.message || "Có lỗi xảy ra. Vui lòng thử lại.",
        });
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      Modal.error({
        title: "Lỗi Google",
        content: "Không thể xử lý phản hồi từ Google.",
      });
    }
  }}
  onError={(err) => {
    console.error("GoogleLogin onError:", err);
    Modal.error({
      title: "Lỗi đăng nhập Google",
      content: "Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc dùng cách khác.",
    });
  }}
/>


</div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;