import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/Register.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Modal, message } from "antd";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[GoogleOAuth] window.location.origin:", window.location.origin);
    console.log("[GoogleOAuth] window.google exists?", !!window.google);
  }, []);

  const handleGoogleRegister = async (credentialResponse) => {
  console.log("[GoogleLogin] Bắt đầu xử lý đăng nhập bằng Google...");

  try {
    if (!credentialResponse?.credential) {
      console.warn("[GoogleLogin] Không có credential từ Google.");
      return;
    }

    const decoded = jwtDecode(credentialResponse.credential);
    console.log("[GoogleLogin] JWT đã giải mã:", decoded);

    const { email, name, picture } = decoded;

    console.log("[GoogleLogin] Gửi request đến /google-login...");
    const res = await fetch("http://localhost:9999/api/auth/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });

    const data = await res.json();
    console.log("[GoogleLogin] API status:", res.status);
    console.log("[GoogleLogin] API response:", data);

    if (res.ok) {
      if (data.shouldRegister || data.needComplete) {
        console.log("[GoogleLogin] Tài khoản chưa tồn tại. Đang lưu thông tin và chuyển trang...");

      localStorage.setItem(
        "googleRegisterData",
        JSON.stringify({
          email: data.email,
          name: data.name,
          picture: picture || "",
        })
      );

        console.log("[GoogleLogin] Dữ liệu đã được lưu vào localStorage:");
        console.log(localStorage.getItem("googleRegisterData"));

        navigate("/complete-profile"); // Fixed route
        console.log("[GoogleLogin] Đã gọi navigate đến /complete-profile");
        return;
      }

      console.log("[GoogleLogin] Tài khoản đã tồn tại. Đang đăng nhập...");
      message.info("Tài khoản đã tồn tại. Vui lòng đăng nhập.");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/login");
    } else {
      console.warn("[GoogleLogin] Server trả lỗi:", data.message);
      alert(data.message || "Lỗi đăng nhập Google.");
    }
  } catch (error) {
    console.error("[GoogleRegister] Lỗi khi xử lý đăng nhập Google:", error);
    alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
  }
};








  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:9999/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, email, phone }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Đăng ký thành công!");
        navigate("/login");
      } else {
        if (data.message === "Email đã tồn tại") {
          alert("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
        } else {
          alert(data.message || "Lỗi khi đăng ký.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="registerContainer">
      <div className="registerWrapper">
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <img
              src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/08763c148032171.62ce0e981e54f.jpg"
              alt="Hình ảnh minh họa"
              className="registerImage"
            />
          </div>
        </div>

        <div className="registerFormContainer">
          <h2 className="registerTitle">ĐĂNG KÝ</h2>
          <form onSubmit={handleSubmit} className="registerForm">
            <div className="formGroup">
              <label htmlFor="name" className="label">Họ và tên</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
            </div>
            <div className="formGroup">
              <label htmlFor="password" className="label">Mật Khẩu</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
            </div>
            <div className="formGroup">
              <label htmlFor="email" className="label">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
            </div>
            <div className="formGroup">
              <label htmlFor="phone" className="label">Số Điện Thoại</label>
              <input type="text" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" required />
            </div>

            <button type="submit" className="registerButton">Đăng Ký</button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p>Hoặc đăng ký bằng Google:</p>
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => {
                console.error("[GoogleLogin] onError triggered — possibly origin not allowed or SDK not loaded");
                alert("Đăng ký bằng Google thất bại");
              }}
            />
          </div>

          <div className="loginLink">
            Bạn Đã Có Tài Khoản? <a href="/login">Đăng Nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
