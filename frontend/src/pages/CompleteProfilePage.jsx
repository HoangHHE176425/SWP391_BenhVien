import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/Register.css"; // dùng lại style cũ
import { Modal } from "antd";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("googleRegisterData");
    if (!stored) {
      Modal.error({
        title: "Lỗi",
        content: "Không tìm thấy thông tin Google đăng ký. Vui lòng đăng nhập lại.",
        onOk: () => navigate("/register"),
      });
      return;
    }

    try {
      const data = JSON.parse(stored);
      setEmail(data.email || "");
      setName(data.name || "");
      setPicture(data.picture || "");
    } catch (err) {
      console.error("Invalid googleRegisterData:", err);
      navigate("/register");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Kiểm tra trường trống
  if (!phone || !password || !confirmPassword) {
    Modal.warning({
      title: "Thiếu thông tin",
      content: "Vui lòng nhập đầy đủ các trường bắt buộc.",
    });
    return;
  }

  // Validate định dạng số điện thoại
  const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    Modal.error({
      title: "Số điện thoại không hợp lệ",
      content: "Vui lòng nhập đúng định dạng số điện thoại.",
    });
    return;
  }
  if (password.length < 6) {
    Modal.warning({
      title: "Mật khẩu quá ngắn",
      content: "Mật khẩu phải có ít nhất 6 ký tự.",
    });
    return;
  }
  // Kiểm tra mật khẩu khớp
  if (password !== confirmPassword) {
    Modal.error({
      title: "Mật khẩu không khớp",
      content: "Vui lòng nhập lại mật khẩu cho khớp.",
    });
    return;
  }

  try {
    // 1. Kiểm tra trùng số điện thoại
    const checkRes = await fetch("http://localhost:9999/api/auth/check-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok || checkData.exists) {
      Modal.error({
        title: "Số điện thoại đã tồn tại",
        content: "Vui lòng dùng số điện thoại khác.",
      });
      return;
    }

    // 2. Gửi yêu cầu hoàn tất hồ sơ
    const res = await fetch("http://localhost:9999/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, phone, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("googleRegisterData");
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      alert("Hoàn tất hồ sơ thành công!");
      navigate("/login");
    } else {
      Modal.error({ title: "Lỗi", content: data.message || "Không thể hoàn tất đăng ký." });
    }
  } catch (error) {
    console.error("Error completing profile:", error);
    Modal.error({ title: "Lỗi kết nối", content: "Vui lòng thử lại sau." });
  }
};



  return (
    <div className="registerContainer">
      <div className="registerWrapper">
        <div className="imageContainer">
          <div className="imagePlaceholder">
            <img
              src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/08763c148032171.62ce0e981e54f.jpg"
              alt="Google Avatar"
              className="registerImage"
            />
          </div>
        </div>

        <div className="registerFormContainer">
          <h2 className="registerTitle">HOÀN THIỆN HỒ SƠ</h2>
          <form onSubmit={handleSubmit} className="registerForm">
            <div className="formGroup">
              <label className="label">Họ và tên</label>
              <input type="text" className="input" value={name} disabled />
            </div>
            <div className="formGroup">
              <label className="label">Email</label>
              <input type="email" className="input" value={email} disabled />
            </div>
            <div className="formGroup">
              <label className="label">Số điện thoại</label>
              <input
                type="text"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="formGroup">
              <label className="label">Tạo mật khẩu</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="formGroup">
              <label className="label">Nhập lại mật khẩu</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="registerButton">Hoàn tất đăng ký</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
