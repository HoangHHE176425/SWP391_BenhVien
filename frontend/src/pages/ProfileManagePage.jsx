import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { Button, Modal, Form, Row, Col, Table, Card } from "react-bootstrap";

const ProfileManagerPage = () => {
    const [profiles, setProfiles] = useState([]);
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        dateOfBirth: "",
        gender: "Male",
        identityNumber: "",
        phone: ""
    });
    const [cccdSearch, setCccdSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRecords, setShowRecords] = useState(false);
    const { token } = useAuth();

    // Hàm chuyển đổi status sang tiếng Việt
    const formatStatus = (status) => {
        const statusMap = {
            'pending_clinical': 'Đang chờ khám',
            'pending_re-examination': 'Đang chờ tái khám',
            'done': 'Đã xong'
        };
        return statusMap[status] || 'Chưa có';
    };

    // Load profile by CCCD
    const fetchProfileByCccd = async () => {
        console.log("fetchProfileByCccd called with CCCD:", cccdSearch);
        console.log("Token:", token);

        if (!token) {
            console.error("No token found, please log in again.");
            setProfiles([]);
            return;
        }

        if (!cccdSearch) {
            console.log("CCCD is empty, setting profiles to empty array.");
            setProfiles([]);
            return;
        }

        if (!/^\d{12}$/.test(cccdSearch)) {
            console.log("Invalid CCCD format, setting profiles to empty array.");
            setProfiles([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:9999/api/profile/cccd?identityNumber=${cccdSearch}`);

            console.log("Full API response:", res.data);

            if (res.data.profile) {
                console.log("Profile found, updating state:", res.data.profile);
                setProfiles([res.data.profile]);
                setShowRecords(false); // Reset trạng thái khi tìm profile mới
                setRecords([]); // Reset records
            } else {
                console.log("No profile found in response.");
                setProfiles([]);
                setRecords([]);
                setShowRecords(false);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err.response?.data || err.message);
            setProfiles([]);
            setRecords([]);
            setShowRecords(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Load records by profileId
    const fetchRecordsByProfileId = async (profileId) => {
        console.log("fetchRecordsByProfileId called with profileId:", profileId);

        if (!token) {
            console.error("No token found, please log in again.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:9999/api/profile/record/${profileId}`);

            console.log("Records API response:", res.data);

            if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setRecords(res.data.data);
                console.log("Processed records:", res.data.data); // Log để debug
            } else {
                setRecords([]);
                console.log("No records data found or data is empty.");
            }
        } catch (err) {
            console.error("Failed to fetch records:", err.response?.data || err.message);
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Validate name (không chứa số)
    const validateName = (name) => {
        const regex = /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]+$/;
        return regex.test(name);
    };

    // Validate identityNumber
    const validateIdentityNumber = (identityNumber) => {
        const regex = /^\d{12}$/;
        return regex.test(identityNumber);
    };

    // Validate phone
    const validatePhone = (phone) => {
        const regex = /^0\d{9}$/;
        return regex.test(phone);
    };

    // Update profile
    const handleSubmit = async () => {
        console.log("handleSubmit called with formData:", formData);

        if (!token) {
            console.error("No token found, please log in again.");
            return;
        }

        if (!validateName(formData.name)) {
            alert("Tên không được chứa số, chỉ chấp nhận chữ cái và khoảng trắng.");
            return;
        }

        if (!validateIdentityNumber(formData.identityNumber)) {
            alert("CMND/CCCD phải là 12 ký tự số, không khoảng trắng, chữ hoặc ký tự đặc biệt.");
            return;
        }

        if (!validatePhone(formData.phone)) {
            alert("Số điện thoại phải là 10 chữ số, bắt đầu bằng 0.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.put(`http://localhost:9999/api/profile/update/${editingProfile._id}`, formData);
            console.log("Update API response:", res.data);
            setShowModal(false);
            setEditingProfile(null);
            setFormData({ name: "", dateOfBirth: "", gender: "Male", identityNumber: "", phone: "" });
            fetchProfileByCccd();
            alert("Cập nhật hồ sơ thành công!");
        } catch (err) {
            console.error("Error updating profile:", err.response?.data || err.message);
            alert(err.response?.data?.message || "Lỗi khi cập nhật hồ sơ.");
        } finally {
            setIsLoading(false);
        }
    };

    // Open modal for editing
    const openEditModal = (profile) => {
        console.log("openEditModal called with profile:", profile);
        setEditingProfile(profile);
        setFormData({
            name: profile.name,
            dateOfBirth: profile.dateOfBirth.split("T")[0],
            gender: profile.gender,
            identityNumber: profile.identityNumber,
            phone: profile.phone || ""
        });
        setShowModal(true);
    };

    // Toggle records visibility
    const toggleRecords = (profileId) => {
        if (!showRecords) {
            fetchRecordsByProfileId(profileId); // Chỉ gọi API khi mở lần đầu hoặc refresh
        }
        setShowRecords(!showRecords); // Toggle trạng thái
    };

    // Log records for debugging during render
    console.log("Rendering with records:", records);

    return (
        <div className="container py-4">
            <h2 className="mb-4 text-center fw-bold">Quản Lý Hồ Sơ</h2>

            {/* Thanh tìm kiếm CCCD */}
            <Row className="mt-4 mb-3 justify-content-center">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo CCCD..."
                        value={cccdSearch}
                        onChange={(e) => setCccdSearch(e.target.value)}
                        disabled={isLoading}
                        className="form-control-sm"
                    />
                </Col>
                <Col md={2}>
                    <Button
                        variant="primary"
                        onClick={fetchProfileByCccd}
                        disabled={isLoading}
                        className="w-100 btn-sm"
                    >
                        {isLoading ? "Đang tìm..." : "Tìm kiếm"}
                    </Button>
                </Col>
            </Row>

            <div className="mt-4">
                {isLoading ? (
                    <p className="text-center">Đang tìm kiếm...</p>
                ) : cccdSearch === "" ? (
                    <p className="text-center">Vui lòng nhập CCCD và nhấn tìm kiếm.</p>
                ) : profiles.length === 0 ? (
                    <p className="text-center text-danger">Hồ sơ bệnh nhân không tồn tại.</p>
                ) : (
                    profiles.map((profile) => (
                        <div key={profile._id} className="mb-4">
                            <Card className="mb-3 shadow-sm border-primary">
                                <Card.Body className="p-3">
                                    <h5 className="card-title fw-bold">{profile.name}</h5>
                                    <p className="card-text"><strong>Giới tính:</strong> {profile.gender}</p>
                                    <p className="card-text"><strong>Ngày sinh:</strong> {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                                    <p className="card-text"><strong>CMND/CCCD:</strong> {profile.identityNumber}</p>
                                    <p className="card-text"><strong>Số điện thoại:</strong> {profile.phone}</p>
                                    <div className="d-flex gap-2 mt-2">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => openEditModal(profile)}
                                            disabled={isLoading}
                                            className="btn-sm"
                                        >
                                            Sửa
                                        </Button>
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => toggleRecords(profile._id)}
                                            disabled={isLoading}
                                            className="btn-sm"
                                        >
                                            {showRecords ? "Ẩn Records" : "Xem Records"}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                            {/* Bảng hiển thị records */}
                            {showRecords && records.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="mb-3 fw-bold">Records</h5>
                                    <div className="table-responsive">
                                        <Table striped bordered hover className="table-sm">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "15%" }}>Bác sĩ khám &amp; điều trị</th>
                                                    <th style={{ width: "10%" }}>Lịch hẹn</th>
                                                    {/* <th style={{ width: "10%" }}>Khoa khám</th> */}
                                                    <th style={{ width: "10%" }}>Ngày nhập viện</th>
                                                    <th style={{ width: "15%" }}>Chẩn đoán nhập viện</th>
                                                    <th style={{ width: "15%" }}>Chẩn đoán ra viện</th>
                                                    <th style={{ width: "10%" }}>Trạng thái</th>
                                                    <th style={{ width: "15%" }}>Tóm tắt điều trị</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {records.map((record) => (
                                                    <tr key={record._id}>
                                                        <td className="text-nowrap">{record.doctorId?.name || 'Chưa có'}</td>
                                                        <td className="text-nowrap">
                                                            {record.appointmentId?.appointmentDate
                                                                ? new Date(record.appointmentId.appointmentDate).toLocaleDateString('vi-VN')
                                                                : 'Chưa có'}
                                                        </td>
                                                        {/* <td className="text-nowrap">{record.department?.name || 'Chưa có'}</td> */}
                                                        <td className="text-nowrap">
                                                            {record.admissionDate
                                                                ? new Date(record.admissionDate).toLocaleDateString('vi-VN')
                                                                : 'Chưa có'}
                                                        </td>
                                                        <td>{record.admissionDiagnosis || 'Chưa có'}</td>
                                                        <td>{record.dischargeDiagnosis || 'Chưa có'}</td>
                                                        <td className="text-nowrap">{formatStatus(record.status)}</td>
                                                        <td>{record.treatmentSummary || 'Chưa có'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật hồ sơ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="form-control-sm"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Ngày sinh</Form.Label>
                            <Form.Control
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                max={new Date().toISOString().split("T")[0]}
                                disabled={isLoading}
                                className="form-control-sm"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Giới tính</Form.Label>
                            <Form.Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="form-select-sm"
                            >
                                <option value="Male">Nam</option>
                                <option value="Female">Nữ</option>
                                <option value="Other">Khác</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Nhập số điện thoại"
                                disabled={isLoading}
                                className="form-control-sm"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        disabled={isLoading}
                        className="btn-sm"
                    >
                        Huỷ
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="btn-sm"
                    >
                        {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProfileManagerPage;