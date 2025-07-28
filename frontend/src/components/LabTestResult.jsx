import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import jwt_decode from 'jwt-decode';
import 'bootstrap/dist/css/bootstrap.min.css';

const LabtestResult = () => {
    const [userId, setUserId] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy userId từ token
    // useEffect(() => {
    //     const token = localStorage.getItem('token');
    //     if (token) {
    //         const decoded = jwt_decode(token);
    //         setUserId(decoded.userId || decoded._id); // tùy token của bạn
    //     } else {
    //         setError('Vui lòng đăng nhập');
    //         setLoading(false);
    //     }
    // }, []);

    // Lấy danh sách profile của user
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                // const response = await axios.get(`http://localhost:9999/api/profiles/user/${userId}`);
                const response = await axios.get(`http://localhost:9999/api/apm/684e7597c7efedc32ca55271/profiles`);
                setProfiles(response.data.data.map(profile => ({
                    id: profile._id,
                    name: profile.name,
                    gender: profile.gender,
                    dateOfBirth: profile.dateOfBirth
                })));
            } catch (err) {
                console.error('Lỗi khi tải hồ sơ:', err);
                setError('Không thể tải danh sách hồ sơ');
            }
        };

        // if (userId) {
        fetchProfiles();
        // }
    }, [userId]);

    // Lấy kết quả xét nghiệm khi chọn profile
    useEffect(() => {
        const fetchLabTests = async () => {
            if (!selectedProfileId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`http://localhost:9999/api/checkup/labtestresult/${selectedProfileId}`);
                setLabTests(response.data || []);
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu xét nghiệm:', err);
                setError('Không thể tải dữ liệu xét nghiệm');
            } finally {
                setLoading(false);
            }
        };

        fetchLabTests();
    }, [selectedProfileId]);

    return (
        <div className="container my-4">
            <h2 className="text-2xl font-bold mb-4">Kết quả xét nghiệm</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group mb-3">
                <label>Chọn hồ sơ:</label>
                <select
                    className="form-control"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                >
                    <option value="">-- Chọn hồ sơ --</option>
                    {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                            {profile.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <div className="text-center">Đang tải...</div>}

            {!loading && selectedProfileId && (
                <div className="row">
                    {labTests.map((test) => (
                        <div key={test._id} className="col-12 mb-3">
                            <div className="card p-3">
                                <h5 className="card-title">{test.fullName}</h5>
                                <p><strong>Giới tính:</strong> {test.gender}</p>
                                <p><strong>Loại mẫu:</strong> {test.sampleType}</p>
                                <p><strong>Ngày lấy mẫu:</strong> {new Date(test.collectionDate).toLocaleDateString()}</p>
                                <p><strong>Người lấy mẫu:</strong> {test.collectedBy}</p>
                                <p><strong>Loại ống đựng:</strong> {test.containerType}</p>
                                <p><strong>Kết quả:</strong> {test.result || 'Chưa có kết quả'}</p>
                                <p><strong>Trạng thái:</strong> {test.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LabtestResult;
