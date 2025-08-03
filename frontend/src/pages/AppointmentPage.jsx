import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Modal, Button, ListGroup } from "react-bootstrap";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import "../assets/css/AppointmentPage.css";
import axios from "axios";
import { useAuth } from "../context/authContext";
import moment from 'moment';

const AppointmentPage = () => {
  const { token } = useAuth();
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
  const [startWeekDate, setStartWeekDate] = useState(moment().startOf('week').format('YYYY-MM-DD'));
  const [weekSlots, setWeekSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [bhytCode, setBhytCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [hasBhyt, setHasBhyt] = useState("Không");
  const steps = [
    { id: "profile", title: "Hồ sơ", desc: "" },
    { id: "department", title: "Chọn khoa", desc: "" },
    { id: "doctor", title: "Chọn bác sĩ", desc: "" },
    { id: "datetime", title: "Chọn ngày giờ", desc: "" },
    { id: "details", title: "Thông tin bổ sung", desc: "" },
    { id: "confirm", title: "Xác nhận", desc: "" },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:9999/api/departments", {
          params: {
            page: 1,
            limit: 50,
            search: "",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const departments = res.data.departments.map((dep) => ({
          id: dep._id,
          name: dep.name,
          description: dep.description,
          icon: dep.icon || "fa fa-stethoscope", // Giả sử có trường icon
        }));

        setDepartmentData(departments);
      } catch (err) {
        console.error("[ERROR] Fetch departments:", err);
      }
    };

    fetchDepartments();
  }, [token]);

  const handleCheckCccd = async () => {
    setLoading(true);
    setError(null);

    if (!identityNumber) {
      setError("Vui lòng nhập CCCD.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        "http://localhost:9999/api/profile/cccd",
        {
          params: {
            identityNumber
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      setError("CMND/CCCD phải là 12 ký tự số, không khoảng trắng, chữ hoặc ký tự đặc biệt.");
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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  useEffect(() => {
    if (selectedDepartment) {
      const fetchDoctors = async () => {
        try {
          console.log("[LOG] Fetching doctors for department:", selectedDepartment);
          const res = await axios.get(`http://localhost:9999/api/doctor/doctor?departmentId=${selectedDepartment}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          console.log("[LOG] Doctors response:", res.data);
          setDoctors(res.data.doctors || []);
        } catch (err) {
          console.error("[ERROR] Fetch doctors:", err);
          setDoctors([]);
        }
      };
      fetchDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedDepartment, token]);

  useEffect(() => {
    if (selectedDoctor && startWeekDate) {
      const fetchWeekSlots = async () => {
        try {
          console.log("[LOG] Fetching slots for doctor:", selectedDoctor, "startDate:", startWeekDate);
          const res = await axios.get(`http://localhost:9999/api/doctor/${selectedDoctor}/slots?startDate=${startWeekDate}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("[LOG] Slots response:", res.data);
          setWeekSlots(res.data.slots || []);
        } catch (err) {
          console.error("[ERROR] Fetch slots:", err);
          setWeekSlots([]);
        }
      };
      fetchWeekSlots();
    }
  }, [selectedDoctor, startWeekDate, token]);

  // Mock data cho cả tuần từ thứ Hai
  useEffect(() => {
    if (selectedDoctor && startWeekDate) {
      const mockSlots = [];
      for (let i = 0; i < 7; i++) {
        const date = moment(startWeekDate).add(i, 'days').startOf('day').toDate();
        mockSlots.push(
          {
            date: date,
            startTime: moment(date).set({ hour: 8, minute: 0 }).toISOString(),
            endTime: moment(date).set({ hour: 8, minute: 30 }).toISOString(),
            status: "Available"
          },
          {
            date: date,
            startTime: moment(date).set({ hour: 9, minute: 0 }).toISOString(),
            endTime: moment(date).set({ hour: 9, minute: 30 }).toISOString(),
            status: "Available"
          }
        );
      }
      setWeekSlots(mockSlots);
    }
  }, [selectedDoctor, startWeekDate]);

  const handleCreateAppointment = async () => {
    setLoading(true);
    setError(null);

    if (!profileId || !selectedDoctor || !selectedDepartment || !selectedSlot || !symptoms) {
      setError("Vui lòng chọn đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    if (hasBhyt === "Có") {
      if (!bhytCode) {
        setError("Vui lòng nhập mã BHYT.");
        setLoading(false);
        return;
      }
      const bhytCodeRegex = /^[A-Z]{2}\d{13}$/;
      if (!bhytCodeRegex.test(bhytCode)) {
        setError("Mã BHYT phải có định dạng 2 chữ cái in hoa + 13 số.");
        setLoading(false);
        return;
      }
    }

    const standardizedStart = moment.utc(selectedSlot.startTime).toISOString();
    const standardizedEnd = moment.utc(selectedSlot.endTime).toISOString();

    try {
      const payload = {
        profileId,
        doctorId: selectedDoctor,
        department: selectedDepartment,
        appointmentDate: selectedSlot.startTime,
        timeSlot: {
          startTime: standardizedStart,
          endTime: standardizedEnd,
          status: 'Booked'
        },
        symptoms,
        type: "Online",
        status: "pending_confirmation",
        room: ""
      };

      if (hasBhyt === "Có" && bhytCode) {
        payload.bhytCode = bhytCode;
      }

      console.log("[LOG] Creating appointment with payload:", payload);

      const res = await axios.post(
        "http://localhost:9999/api/user/create",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("[LOG] Create appointment success:", res.data);
      setSuccess(true);
      setStep("confirm");
    } catch (err) {
      console.error("[ERROR] Create appointment:", err.response?.data || err);
      setError("Đặt lịch thất bại.");
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
                  <div
                    className={`department-card p-4 rounded shadow-sm text-center cursor-pointer position-relative ${selectedDepartment === dep.id ? "selected" : ""
                      }`}
                    onClick={() => setSelectedDepartment(dep.id)}
                  >
                    <i className={`${dep.icon} fa-2x text-primary mb-3`}></i>
                    <h5 className="fw-semibold">{dep.name}</h5>
                    {dep.description && <p className="text-muted small mb-0">{dep.description}</p>}
                    {selectedDepartment === dep.id && (
                      <i className="fas fa-check-circle text-success position-absolute" style={{ top: '10px', right: '10px', fontSize: '1.5rem' }}></i>
                    )}
                  </div>
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
                <Col className="text-center">
                  Không có bác sĩ trong chuyên khoa này
                </Col>
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
              <button className="btn btn-primary" onClick={() => setStep("datetime")} disabled={!selectedDoctor}>
                Tiếp Theo
              </button>
            </div>
          </div>
        );

      case "datetime":
        const now = moment();
        const defaultStartDate = startWeekDate || moment().isoWeekday(1).format('YYYY-MM-DD');
        const twoHoursLater = moment().add(2, 'hours');

        return (
          <div className="p-4 bg-white rounded shadow-sm">
            <h3 className="text-primary fw-bold mb-4">Chọn Ngày và Giờ</h3>
            <div className="mb-3">
              <label className="form-label">Chọn ngày bắt đầu (Thứ Hai)</label>
              <Flatpickr
                className="form-control"
                value={defaultStartDate}
                options={{
                  dateFormat: "Y-m-d",
                  minDate: moment().isoWeekday(1).format('YYYY-MM-DD'),
                  disable: [
                    function (date) {
                      return date.getDay() !== 1; // Chỉ cho phép chọn thứ Hai
                    }
                  ],
                  locale: {
                    firstDayOfWeek: 1 // Bắt đầu tuần từ thứ Hai
                  }
                }}
                onChange={([date]) => {
                  const selectedDate = moment(date).format('YYYY-MM-DD');
                  setStartWeekDate(selectedDate);
                }}
              />
            </div>
            {weekSlots.length === 0 ? (
              <p className="text-muted">Không có slot khả dụng cho tuần đã chọn.</p>
            ) : (
              <ListGroup className="slot-list">
                {weekSlots
                  .filter(slot => moment(slot.date).isSameOrAfter(now, 'day'))
                  .filter(slot => moment(slot.startTime).isAfter(twoHoursLater))
                  .filter(slot => slot.status === "Available")
                  .sort((a, b) => moment(a.date).diff(moment(b.date)) || moment(a.startTime).diff(moment(b.startTime)))
                  .map((slot, slotIdx) => (
                    <ListGroup.Item
                      key={slotIdx}
                      action
                      active={selectedSlot && selectedSlot.startTime === slot.startTime}
                      onClick={() => setSelectedSlot(slot)}
                      className="d-flex align-items-center slot-item"
                    >
                      <input
                        type="radio"
                        className="form-check-input me-3"
                        checked={selectedSlot ? selectedSlot.startTime === slot.startTime : false}
                        onChange={() => setSelectedSlot(slot)}
                        disabled={moment(slot.date).isBefore(now, 'day') || slot.status !== "Available"}
                      />
                      <span>
                        {moment(slot.startTime).format('HH:mm')} - {moment(slot.endTime).format('HH:mm')}
                        ({moment(slot.date).format('dddd, DD/MM/YYYY')})
                      </span>
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            )}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep("doctor")}>
                Quay Lại
              </button>
              <button className="btn btn-primary" onClick={() => setStep("details")} disabled={!selectedSlot}>
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
              <label className="form-label">Triệu chứng</label>
              <textarea
                className="form-control"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Mô tả triệu chứng"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Bạn có sử dụng BHYT không?</label>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="hasBhytYes"
                  name="hasBhyt"
                  value="Có"
                  checked={hasBhyt === "Có"}
                  onChange={(e) => {
                    setHasBhyt(e.target.value);
                    if (e.target.value === "Không") setBhytCode("");
                  }}
                />
                <label className="form-check-label" htmlFor="hasBhytYes">
                  Có
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="hasBhytNo"
                  name="hasBhyt"
                  value="Không"
                  checked={hasBhyt === "Không"}
                  onChange={(e) => setHasBhyt(e.target.value)}
                />
                <label className="form-check-label" htmlFor="hasBhytNo">
                  Không
                </label>
              </div>
              {hasBhyt === "Có" && (
                <div className="mb-3">
                  <label className="form-label">Mã BHYT</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bhytCode}
                    onChange={(e) => setBhytCode(e.target.value)}
                    placeholder="Nhập mã BHYT"
                  />
                </div>
              )}
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep("datetime")}>
                Quay Lại
              </button>
              <button className="btn btn-primary" onClick={handleCreateAppointment} disabled={loading || !symptoms}>
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
            <p>Lịch hẹn của bạn đã được tạo và đang chờ xác nhận từ lễ tân. Vui lòng kiểm tra email hoặc thông báo để cập nhật tình trạng.</p>
            <div className="mt-4 d-flex justify-content-center gap-3">
              <button className="btn btn-primary" onClick={() => setStep("profile")}>
                Đặt Thêm Lịch
              </button>
              <button className="btn btn-outline-secondary" onClick={() => navigate("/myappointments")}>
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
      <div className="bg-light py-3 px-5 d-none d-lg-block border-bottom shadow-sm">
        <Row className="align-items-center justify-content-between">
          <Col md={6} className="text-start">
            <small className="text-muted">
              <i className="far fa-clock text-primary me-2"></i>
              Giờ Mở Cửa: Thứ 2 - Thứ 7: 7:00 Sáng - 8:00 Tối, Chủ Nhật: 9:00
              Sáng - 5:00 Chiều
            </small>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted me-4">
              <i className="fa fa-envelope-open text-primary me-2"></i>
              contact@Vietcare.com
            </small>
            <small className="text-muted">
              <i className="fa fa-phone-alt text-primary me-2"></i>
              +987 654 3210
            </small>
          </Col>
        </Row>
      </div>

      <div
        id="heroCarousel"
        className="carousel slide carousel-fade"
        data-bs-ride="carousel"
        data-bs-interval="4000"
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d"
              className="d-block w-100"
              alt="Vietcare Banner"
              style={{
                objectFit: "cover",
                height: "80vh",
                borderRadius: "8px",
              }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                position: "absolute",
                borderRadius: "8px",
              }}
            >
              <h1 className="display-3 fw-bold text-white mb-3">
                Đặt Lịch Hẹn Tại Vietcare
              </h1>
              <p className="text-white fs-5">
                Dễ dàng đặt lịch với các bác sĩ chuyên khoa hàng đầu
              </p>
            </div>
          </div>
        </div>
      </div>

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

export default AppointmentPage;