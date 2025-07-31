import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateProfile = () => {
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [issues, setIssues] = useState('');
    const [diagnose, setDiagnose] = useState('');
    const [notes, setNotes] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await axios.get('http://localhost:9999/api/receptionist/doctors');
                if (response.data.success) {
                    setDoctors(response.data.data);
                } else {
                    setError('Không thể tải danh sách bác sĩ');
                }
            } catch {
                setError('Lỗi server khi tải danh sách bác sĩ');
            }
        };
        fetchDoctors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('http://localhost:9999/api/receptionist/medical-record', {
                userId: userId.trim() || null, // nếu không có userId sẽ là null
                name,
                dob,
                gender,
                issues,
                diagnose,
                notes,
                doctorId
            });

            if (response.data.success) {
                setSuccess('Tạo hồ sơ thành công!');
                setUserId('');
                setName('');
                setDob('');
                setGender('');
                setIssues('');
                setDiagnose('');
                setNotes('');
                setDoctorId('');
            } else {
                setError(response.data.message || 'Đã xảy ra lỗi');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi kết nối đến server');
        }
    };

    return (
        <div className="container my-4">
            <h2 className="mb-4">Tạo hồ sơ bệnh nhân</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">User ID (nếu có)</label>
                    <input
                        type="text"
                        className="form-control"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Nhập ID người dùng (nếu có)"
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Họ tên</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Ngày sinh</label>
                    <input
                        type="date"
                        className="form-control"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Giới tính</label>
                    <select
                        className="form-control"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                    >
                        <option value="">Chọn giới tính</option>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                        <option value="Other">Khác</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Triệu chứng</label>
                    <textarea
                        className="form-control"
                        value={issues}
                        onChange={(e) => setIssues(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label className="form-label">Chẩn đoán</label>
                    <textarea
                        className="form-control"
                        value={diagnose}
                        onChange={(e) => setDiagnose(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <textarea
                        className="form-control"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label className="form-label">Bác sĩ phụ trách</label>
                    <select
                        className="form-control"
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        required
                    >
                        <option value="">Chọn bác sĩ</option>
                        {doctors.map(doc => (
                            <option key={doc._id} value={doc._id}>
                                {doc.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">Tạo hồ sơ</button>
            </form>
        </div>
    );
};

export default CreateProfile;
