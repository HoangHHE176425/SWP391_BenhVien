import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import "../assets/css/ProfilePage.css";

const ProfileDoctor = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: user?.name || "",
    phone: user?.phone || "",
    department: user?.department || "",
    specialization: user?.specialization || "",
  });
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || null
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    setFormData({
      fullname: user?.name || "",
      phone: user?.phone || "",
      department: user?.department || "",
      specialization: user?.specialization || "",
    });
    setProfilePicture(user?.profilePicture || null);
  }, [user]);

  useEffect(() => {
 const fetchDepartments = async () => {
  try {
    const res = await fetch("http://localhost:9999/api/departments", {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    const data = await res.json();
    console.log("🚀 API Response for departments:", data);

    const deptList = Array.isArray(data?.departments)
      ? data.departments
      : Array.isArray(data)
      ? data
      : [];

    setDepartments(deptList);
  } catch (err) {
    console.error("❌ Failed to fetch departments:", err);
  }
};


    if (user?.role === "Doctor") {
      fetchDepartments();
    }
  }, [user]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let updatedProfilePicture = profilePicture;

      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append("profilePicture", file);

        const uploadRes = await fetch(
          "http://localhost:9999/api/user/upload-profile-picture",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            body: uploadFormData,
          }
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.msg || "Upload ảnh thất bại");

        updatedProfilePicture = uploadData.profilePictureUrl;
      }
      // Chuẩn bị payload sạch sẽ
      const payload = {
        email: user.email,
        name: formData.fullname,
        phone: formData.phone,
        status: "active",
        profilePicture: updatedProfilePicture,
      };

      // Chỉ thêm nếu có giá trị thực sự
      if (user.role === "Doctor") {
        if (formData.department && formData.department.trim() !== "") {
          payload.department = formData.department;
        }
        if (formData.specialization && formData.specialization.trim() !== "") {
          payload.specialization = formData.specialization;
        }
      }
    const res = await fetch("http://localhost:9999/api/user/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      const updatedUser = {
        ...user,
        name: formData.fullname,
        phone: formData.phone,
        profilePicture: updatedProfilePicture,
        ...(user.role === "Doctor" && {
          department: formData.department,
          specialization: formData.specialization,
        }),
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(updatedUser);
      setSuccess("Cập nhật thành công!");
      setFile(null);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="text-primary mb-4">Hồ Sơ Cá Nhân</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="text-center mb-4">
            <img
              src={profilePicture || "https://via.placeholder.com/150"}
              alt="Profile"
              className="rounded-circle mb-3"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ""}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="role" className="form-label">
                  Vai Trò
                </label>
                <input
                  type="text"
                  id="role"
                  value={user?.role || ""}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="status" className="form-label">
                  Trạng Thái
                </label>
                <input
                  type="text"
                  id="status"
                  value={user?.status || "Active"}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="fullname" className="form-label">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="form-control"
                  disabled
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">
                  Số Điện Thoại
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-control"
                  disabled
                />
              </div>

              {/* Chỉ hiện nếu là Doctor */}
              {user?.role === "Doctor" && (
                <>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="department" className="form-label">
                      Khoa
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={
                        departments.find((dept) => dept._id === formData.department)?.name || ""
                      }
                      className="form-control"
                      disabled
                    />
                  </div>


                  <div className="col-md-6 mb-3">
                    <label htmlFor="specialization" className="form-label">
                      Chuyên Môn
                    </label>
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="form-control"
                      disabled 
                    />
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileDoctor;
