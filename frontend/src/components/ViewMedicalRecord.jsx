import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../assets/css/ViewMedicalRecords.css';

const ViewMedicalRecords = () => {
    const [profiles, setProfiles] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [order, setOrder] = useState('desc');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate(); // Initialize navigate hook

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:9999/api/receptionist/medical-records', {
                params: { page, limit, search, sortBy, order },
            });
            if (res.data.success) {
                setProfiles(res.data.data);
                setTotalPages(res.data.totalPages);
                setError('');
            } else {
                setError(res.data.message || 'Không thể tải dữ liệu');
            }
        } catch (err) {
            setError('Lỗi kết nối server' + err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, [page, limit, search, sortBy, order]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleReset = () => {
        setSearch('');
        setSortBy('createdAt');
        setOrder('desc');
        setLimit(5);
        setPage(1);
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN');

    return (
        <div className="container mt-5 mb-5">
            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="card-title text-primary">Danh Sách Hồ Sơ Y Tế</h3>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/receptionist/add/medicalrecords')}
                            aria-label="Xem hồ sơ y tế"
                        >
                            Tạo Hồ Sơ
                        </Button>
                    </div>

                    {/* Search and Filters */}
                    <div className="row mb-4 g-3">
                        <div className="col-md-4 col-sm-12">
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm kiếm tên, chẩn đoán, triệu chứng..."
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </InputGroup>
                        </div>
                        <div className="col-md-3 col-sm-6">
                            <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                title="Sắp xếp theo tiêu chí"
                            >
                                <option value="createdAt">Ngày tạo</option>
                                <option value="name">Tên</option>
                                <option value="gender">Giới tính</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-2 col-sm-6">
                            <Form.Select
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                title="Thứ tự sắp xếp"
                            >
                                <option value="desc">Giảm dần</option>
                                <option value="asc">Tăng dần</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-2 col-sm-6">
                            <Form.Select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                title="Số lượng mỗi trang"
                            >
                                <option value={5}>5 / trang</option>
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-1 col-sm-6">
                            <Button
                                variant="outline-secondary"
                                onClick={handleReset}
                                title="Đặt lại bộ lọc"
                                className="w-100"
                            >
                                <FaSync />
                            </Button>
                        </div>
                    </div>

                    {/* Data Table */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">Không tìm thấy hồ sơ nào.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered align-middle">
                                    <thead className="table-primary">
                                        <tr>
                                            <th>Tên</th>
                                            <th>Ngày sinh</th>
                                            <th>Giới tính</th>
                                            <th>Triệu chứng</th>
                                            <th>Chẩn đoán</th>
                                            <th>Bác sĩ</th>
                                            <th>Thuốc</th>
                                            <th>Ngày tạo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profiles.map((p) => (
                                            <tr key={p._id}>
                                                <td>{p.name}</td>
                                                <td>{formatDate(p.dateOfBirth)}</td>
                                                <td>
                                                    <Badge
                                                        bg={p.gender === 'Nam' ? 'info' : 'warning'}
                                                        className="px-2 py-1"
                                                    >
                                                        {p.gender}
                                                    </Badge>
                                                </td>
                                                <td>{p.issues || '---'}</td>
                                                <td>{p.diagnose || '---'}</td>
                                                <td>{p.doctorId?.name || '---'}</td>
                                                <td>{p.medicine?.name || '---'}</td>
                                                <td>{formatDate(p.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Button
                                    variant="primary"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                >
                                    Trang trước
                                </Button>
                                <span className="text-muted">
                                    Trang {page} / {totalPages}
                                </span>
                                <Button
                                    variant="primary"
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    Trang sau
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewMedicalRecords;