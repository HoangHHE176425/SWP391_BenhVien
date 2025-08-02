import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Modal, Button } from "react-bootstrap";
import axios from "axios";
import moment from 'moment';
import "../../assets/css/AppointmentPage.css";

const OfflineAppointmentPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("profile");
  const [identityNumber, setIdentityNumber] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileDateOfBirth, setProfileDateOfBirth] = useState("");
  const [profilePhoneNumber, setProfilePhoneNumber] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [bhytCode, setBhytCode] = useState("");
  const [hasBhyt, setHasBhyt] = useState("no"); // Thêm state mới: "yes" hoặc "no" cho BHYT
  const [appointmentType, setAppointmentType] = useState("Offline");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Các bước đã được tối ưu, bỏ bước datetime
  const steps = [
    { id: "profile", title: "Hồ sơ", desc: "" },
    { id: "department", title: "Chọn khoa", desc: "" },
    { id: "doctor", title: "Chọn bác sĩ", desc: "" },
    { id: "details", title: "Thông tin bổ sung", desc: "" },
    { id: "confirm", title: "Xác nhận", desc: "" },
  ];

  // Lấy danh sách khoa
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:9999/api/departments", {
          params: { page: 1, limit: 50, search: "" },
        });
        const departments = res.data.departments.map((dep) => ({
          id: dep._id,
          name: dep.name,
          description: dep.description,
        }));
        setDepartmentData(departments);
      } catch (err) {
        console.error("[ERROR] Fetch departments:", err);
        setError("Không tải được danh sách khoa.");
      }
    };
    fetchDepartments();
  }, []);

  // Lấy danh sách bác sĩ
  useEffect(() => {
    if (selectedDepartment) {
      const fetchDoctors = async () => {
        try {
          const res = await axios.get(`http://localhost:9999/api/doctor/doctor?departmentId=${selectedDepartment}`);
          setDoctors(res.data.doctors || []);
        } catch (err) {
          console.error("[ERROR] Fetch doctors:", err);
          setDoctors([]);
          setError("Không tải được danh sách bác sĩ.");
        }
      };
      fetchDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedDepartment]);

  // Kiểm tra CCCD
  const handleCheckCccd = async () => {
    setLoading(true);
    setError(null);

    if (!identityNumber) {
      setError("Vui lòng nhập CCCD.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:9999/api/profile/cccd", {
        params: { identityNumber },
      });

      if (res.data.profile) {
        setProfileId(res.data.profile._id);
        setStep("department");
      } else {
        setShowCreateModal(true);
      }
    } catch (err) {
      console.error("[ERROR] Check CCCD:", err);
      setError("Kiểm tra CCCD thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Tạo hồ sơ mới
  const handleCreateProfile = async () => {
    setLoading(true);
    setError(null);

    const regexName = /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]+$/;
    if (!regexName.test(profileName)) {
      setError("Tên không được chứa số, chỉ chấp nhận chữ cái và khoảng trắng.");
      setLoading(false);
      return;
    }

    const regexId = /^\d{12}$/;
    if (!regexId.test(identityNumber)) {
      setError("CMND/CCCD phải là 12 ký tự số.");
      setLoading(false);
      return;
    }

    const regexPhone = /^(0[1-9][0-9]{8,9})$/;
    if (!regexPhone.test(profilePhoneNumber)) {
      setError("Số điện thoại không hợp lệ (phải là 10-11 số, bắt đầu 0).");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:9999/api/profile/create",
        {
          identityNumber,
          name: profileName,
          dateOfBirth: profileDateOfBirth,
          gender: profileGender,
          phone: profilePhoneNumber,
        }
      );

      setProfileId(res.data.profile._id);
      setShowCreateModal(false);
      setSuccess(true);
      setStep("department");
    } catch (err) {
      console.error("[ERROR] Create profile:", err);
      setError("Tạo hồ sơ thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Tạo lịch hẹn offline (timeSlot tự động dựa trên thời gian hiện tại)
  const handleCreateAppointment = async () => {
    setLoading(true);
    setError(null);

    if (!profileId || !selectedDoctor || !selectedDepartment) {
      setError("Vui lòng chọn đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    // Validation cho BHYT: Nếu chọn "Có" nhưng không nhập mã
    if (hasBhyt === "yes" && (!bhytCode || !bhytCode.trim())) {
      setError("Vui lòng nhập mã BHYT nếu bạn có.");
      setLoading(false);
      return;
    }

    try {
      const now = moment();
      const startTime = now.startOf('minute').toISOString();
      const endTime = now.clone().add(30, 'minutes').toISOString(); // Sử dụng clone() để tránh mutate now

      // Chuẩn hóa bhytCode dựa trên lựa chọn
      const normalizedBhytCode = hasBhyt === "yes" ? (bhytCode.trim() || null) : null;

      await axios.post("http://localhost:9999/api/user/create-offline", {
        profileId,
        doctorId: selectedDoctor,
        department: selectedDepartment,
        appointmentDate: now.toISOString(),
        timeSlot: {
          startTime,
          endTime,
          status: "Booked"
        },
        symptoms: symptoms || "Không có triệu chứng",
        bhytCode: normalizedBhytCode,
        type: appointmentType,
        status: "confirmed",
      });

      setSuccess(true);
      setStep("confirm");
    } catch (err) {
      console.error("[ERROR] Create appointment:", err.response?.data || err);
      setError("Đặt lịch thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "profile":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="display-6 fw-bold text-primary mb-4">Hồ Sơ</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Nhập CCCD</label>
              <input
                type="text"
                className="form-control"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                maxLength={12}
                placeholder="Nhập số CCCD"
              />
            </div>
            <div className="text-end mt-4">
              <button
                className="btn btn-primary"
                onClick={handleCheckCccd}
                disabled={loading || !identityNumber}
              >
                {loading ? "Đang kiểm tra..." : "Kiểm tra CCCD"}
              </button>
            </div>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Tạo Hồ Sơ Mới</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-3">
                  <label className="form-label">Họ và tên</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Giới tính</label>
                  <select
                    className="form-select"
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    type="date"
                    className="form-control"
                    value={profileDateOfBirth}
                    onChange={(e) => setProfileDateOfBirth(e.target.value)}
                    max={moment().format('YYYY-MM-DD')}
                    min={moment().subtract(120, 'years').format('YYYY-MM-DD')}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profilePhoneNumber}
                    onChange={(e) => setProfilePhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Đóng
                </Button>
                <Button variant="primary" onClick={handleCreateProfile} disabled={loading}>
                  {loading ? "Đang tạo..." : "Tạo hồ sơ"}
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        );

      case "department":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Chuyên Khoa</h3>
            <Row>
              {departmentData.map((dep) => (
                <Col key={dep.id} md={6} className="mb-4">
                  <label
                    className={`border p-4 rounded text-center cursor-pointer hover:bg-light ${selectedDepartment === dep.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedDepartment(dep.id)}
                  >
                    <input type="radio" name="department" className="d-none" />
                    <h5 className="fw-semibold">{dep.name}</h5>
                    {dep.description && <p className="text-muted small mb-0">{dep.description}</p>}
                  </label>
                </Col>
              ))}
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep("profile")}>
                Quay Lại
              </button>
              <button className="btn btn-primary" onClick={() => setStep("doctor")} disabled={!selectedDepartment}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );

      case "doctor":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Bác Sĩ</h3>
            <Row>
              {doctors.length === 0 ? (
                <Col className="text-center">Không có bác sĩ trong chuyên khoa này</Col>
              ) : (
                doctors.map((doctor) => (
                  <Col key={doctor._id} xs={12} sm={6} md={4} lg={4} className="mb-4">
                    <label
                      className={`doctor-card ${selectedDoctor === doctor._id ? "selected" : ""}`}
                      onClick={() => setSelectedDoctor(doctor._id)}
                    >
                      <input type="radio" name="doctor" className="d-none" />
                      <div className="doctor-image-container">
                        {doctor.avatar ? (
                          <img src={doctor.avatar} alt={doctor.name} className="doctor-image" />
                        ) : (
                          <div className="doctor-image bg-light d-flex align-items-center justify-content-center">
                            {doctor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h5 className="doctor-name">{doctor.name}</h5>
                      <p className="doctor-degree">{doctor.specialization || "Chưa có chuyên môn"}</p>
                      <p className="doctor-experience">{doctor.expYear || "Chưa cập nhật"} năm kinh nghiệm</p>
                    </label>
                  </Col>
                ))
              )}
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep("department")}>
                Quay Lại
              </button>
              <button className="btn btn-primary" onClick={() => setStep("details")} disabled={!selectedDoctor}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Thông Tin Bổ Sung</h3>
            <div className="mb-3">
              <label className="form-label">Loại lịch hẹn</label>
              <select
                className="form-select"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              >
                <option value="Offline">Trực tiếp</option>
                <option value="Online">Trực tuyến</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Triệu chứng</label>
              <textarea
                className="form-control"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Mô tả triệu chứng (nếu có)"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Bạn có BHYT không?</label>
              <div className="d-flex">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="hasBhyt"
                    id="hasBhytYes"
                    value="yes"
                    checked={hasBhyt === "yes"}
                    onChange={(e) => {
                      setHasBhyt(e.target.value);
                      if (e.target.value === "no") setBhytCode(""); // Xóa mã nếu chọn Không
                    }}
                  />
                  <label className="form-check-label" htmlFor="hasBhytYes">
                    Có
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="hasBhyt"
                    id="hasBhytNo"
                    value="no"
                    checked={hasBhyt === "no"}
                    onChange={(e) => {
                      setHasBhyt(e.target.value);
                      setBhytCode(""); // Xóa mã nếu chọn Không
                    }}
                  />
                  <label className="form-check-label" htmlFor="hasBhytNo">
                    Không
                  </label>
                </div>
              </div>
            </div>
            {hasBhyt === "yes" && (
              <div className="mb-3">
                <label className="form-label">Mã BHYT</label>
                <input
                  type="text"
                  className="form-control"
                  value={bhytCode}
                  onChange={(e) => setBhytCode(e.target.value)}
                  placeholder="Nhập mã BHYT"
                  required // Bắt buộc nếu chọn Có
                />
              </div>
            )}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep("doctor")}>
                Quay Lại
              </button>
              <button className="btn btn-primary" onClick={handleCreateAppointment} disabled={loading}>
                {loading ? "Đang đặt lịch..." : "Xác Nhận Đặt Lịch"}
              </button>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="p-4 bg-white rounded shadow-sm text-center">
            <h3 className="text-primary fw-bold mb-3">Đặt Lịch Thành Công</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <p>Lịch hẹn của bạn đã được tạo và xác nhận. Vui lòng kiểm tra danh sách lịch hẹn để quản lý.</p>
            <div className="mt-4 d-flex justify-content-center gap-3">
              <button className="btn btn-primary" onClick={() => setStep("profile")}>
                Đặt Thêm Lịch
              </button>
              <button className="btn btn-outline-secondary" onClick={() => navigate("/receptionist/appointments")}>
                Quản lý Lịch
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="container py-5">
        <section className="mb-5">
          <Row className="align-items-start">
            <Col lg={3} className="mb-4 mb-lg-0">
              <div
                className="bg-primary text-white p-4 rounded shadow-sm sticky-top"
                style={{ top: "20px" }}
              >
                <ul className="list-unstyled">
                  {steps.map((s, index) => (
                    <li
                      key={s.id}
                      className={`d-flex align-items-center mb-3 ${step === s.id ? "fw-bold" : ""}`}
                    >
                      <span
                        className={`d-inline-block rounded-circle text-center me-2 ${steps.findIndex((st) => st.id === step) >= index
                          ? "bg-white text-primary"
                          : "bg-light text-white"
                          }`}
                        style={{
                          width: "24px",
                          height: "24px",
                          lineHeight: "24px",
                        }}
                      >
                        {steps.findIndex((st) => st.id === step) >= index ? "✓" : "•"}
                      </span>
                      <div>
                        <div className="small fw-semibold">{s.title}</div>
                        <div className="small text-light">{s.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col lg={9}>{renderStepContent()}</Col>
          </Row>
        </section>
      </div>
    </>
  );
};

export default OfflineAppointmentPage;