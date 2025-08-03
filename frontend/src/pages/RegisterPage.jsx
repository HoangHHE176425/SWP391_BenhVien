import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/Register.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

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
    try {
      console.log("[GoogleLogin] Credential Response:", credentialResponse);

      if (!credentialResponse?.credential) {
        console.warn("[GoogleLogin] No credential found in response.");
        return;
      }

      const decoded = jwtDecode(credentialResponse.credential);
      console.log("[GoogleLogin] Decoded JWT:", decoded);

      const res = await fetch("http://localhost:9999/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      console.log("[GoogleLogin] API status:", res.status);
      console.log("[GoogleLogin] API response:", data);

      if (res.ok) {
  if (data.needComplete) {
    alert(data.message || "Google xác thực thành công, cần hoàn thiện hồ sơ.");
    localStorage.setItem("googleRegisterData", JSON.stringify(data));

    console.log("[GoogleLogin] Navigating to /complete-profile");
    navigate("/complete-profile");
    console.log("[GoogleLogin] After navigate call");
  } else {
    alert("Đăng ký bằng Google thành công!");
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);

    console.log("[GoogleLogin] Navigating to /");
    navigate("/");
  }
}
 else {
        alert(data.message || "Google đăng ký thất bại.");
      }
    } catch (error) {
      console.error("[GoogleLogin] Catch error:", error);
      alert("Lỗi khi đăng ký bằng Google.");
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
        alert(data.message || "Lỗi khi đăng ký.");
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
