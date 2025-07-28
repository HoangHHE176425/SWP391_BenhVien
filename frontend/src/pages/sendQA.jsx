import React, { useState } from "react";
import axios from "axios";
import "../assets/css/SendQAForm.css"; 

const SendQAForm = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [formData, setFormData] = useState({
    email: "",
    title: "",
    message: "",
    userId: user ? user._id : null,
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setLoading(true);

    try {
      await axios.post("/api/user/qa", formData);
      setSuccessMsg("Gửi yêu cầu thành công!");
      setFormData({ email: "", title: "", message: "", userId: formData.userId });
    } catch (error) {
      setErrorMsg(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qa-container">
      <form className="qa-form" onSubmit={handleSubmit}>
        <h2 className="qa-title">Gửi Yêu Cầu Hỗ Trợ</h2>

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email của bạn"
          required
        />

        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Tiêu đề"
          required
        />

        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Nội dung ..."
          rows="6"
          required
        ></textarea>

        <button type="submit" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi Yêu Cầu"}
        </button>

        {successMsg && <div className="qa-success">{successMsg}</div>}
        {errorMsg && <div className="qa-error">{errorMsg}</div>}
      </form>
    </div>
  );
};

export default SendQAForm;
