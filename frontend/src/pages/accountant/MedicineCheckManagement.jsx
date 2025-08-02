import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const MedicineCheckManagement = () => {
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCheck, setSelectedCheck] = useState(null);
    const [checkDetails, setCheckDetails] = useState([]);
    const [filters, setFilters] = useState({
        trangThai: '',
        nhaCungCap: '',
        searchTerm: ''
    });

    // Form states
    const [createForm, setCreateForm] = useState({
        soHoaDon: '',
        nhaCungCap: '',
        ghiChu: ''
    });

    const [detailForm, setDetailForm] = useState({
        maThuoc: '',
        tenThuoc: '',
        soLo: '',
        hanDung: '',
        soLuongNhap: '',
        soLuongThucTe: '',
        donViTinh: '',
        giaNhap: '',
        ghiChu: ''
    });

    useEffect(() => {
        fetchChecks();
    }, [currentPage, filters]);

    const fetchChecks = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...filters
            };
            
            const response = await axios.get('/api/accountant/medicine-check/checks', { params });
            setChecks(response.data.checks);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching checks:', error);
            toast.error('Không thể tải danh sách phiếu kiểm');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCheck = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/accountant/medicine-check/checks', createForm);
            toast.success('Tạo phiếu kiểm thành công');
            setShowCreateModal(false);
            setCreateForm({ soHoaDon: '', nhaCungCap: '', ghiChu: '' });
            fetchChecks();
        } catch (error) {
            console.error('Error creating check:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo phiếu kiểm');
        }
    };

    const handleViewDetail = async (checkId) => {
        try {
            const response = await axios.get(`/api/accountant/medicine-check/checks/${checkId}`);
            setSelectedCheck(response.data.check);
            setCheckDetails(response.data.details);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching check detail:', error);
            toast.error('Không thể tải chi tiết phiếu kiểm');
        }
    };

    const handleAddDetail = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/accountant/medicine-check/checks/${selectedCheck._id}/details`, detailForm);
            toast.success('Thêm chi tiết thuốc thành công');
            setDetailForm({
                maThuoc: '', tenThuoc: '', soLo: '', hanDung: '',
                soLuongNhap: '', soLuongThucTe: '', donViTinh: '', giaNhap: '', ghiChu: ''
            });
            // Refresh details
            const response = await axios.get(`/api/accountant/medicine-check/checks/${selectedCheck._id}`);
            setCheckDetails(response.data.details);
        } catch (error) {
            console.error('Error adding detail:', error);
            toast.error(error.response?.data?.message || 'Không thể thêm chi tiết thuốc');
        }
    };

    const handleUpdateDetail = async (detailId, soLuongThucTe, ghiChu) => {
        try {
            await axios.put(`/api/accountant/medicine-check/checks/details/${detailId}`, {
                soLuongThucTe,
                ghiChu
            });
            toast.success('Cập nhật thành công');
            // Refresh details
            const response = await axios.get(`/api/accountant/medicine-check/checks/${selectedCheck._id}`);
            setCheckDetails(response.data.details);
        } catch (error) {
            console.error('Error updating detail:', error);
            toast.error('Không thể cập nhật chi tiết thuốc');
        }
    };

    const handleCompleteCheck = async () => {
        try {
            await axios.put(`/api/accountant/medicine-check/checks/${selectedCheck._id}/complete`);
            toast.success('Hoàn tất kiểm thuốc thành công');
            setShowDetailModal(false);
            fetchChecks();
        } catch (error) {
            console.error('Error completing check:', error);
            toast.error('Không thể hoàn tất kiểm thuốc');
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'Chưa kiểm': 'warning',
            'Đã kiểm': 'success',
            'Có sai lệch': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Quản lý kiểm thuốc</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        Tạo phiếu kiểm mới
                    </Button>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select
                                    value={filters.trangThai}
                                    onChange={(e) => setFilters({...filters, trangThai: e.target.value})}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Chưa kiểm">Chưa kiểm</option>
                                    <option value="Đã kiểm">Đã kiểm</option>
                                    <option value="Có sai lệch">Có sai lệch</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Nhà cung cấp</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm theo nhà cung cấp"
                                    value={filters.nhaCungCap}
                                    onChange={(e) => setFilters({...filters, nhaCungCap: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Mã phiếu, số hóa đơn..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button variant="outline-secondary" onClick={() => setFilters({trangThai: '', nhaCungCap: '', searchTerm: ''})}>
                                Xóa bộ lọc
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Checks Table */}
            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">Đang tải...</div>
                    ) : (
                        <>
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Mã phiếu</th>
                                        <th>Ngày kiểm</th>
                                        <th>Số hóa đơn</th>
                                        <th>Nhà cung cấp</th>
                                        <th>Người kiểm</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checks.map((check) => (
                                        <tr key={check._id}>
                                            <td>{check.maPhieuKiem}</td>
                                            <td>{formatDate(check.ngayKiem)}</td>
                                            <td>{check.soHoaDon}</td>
                                            <td>{check.nhaCungCap}</td>
                                            <td>{check.nguoiKiem?.name}</td>
                                            <td>{getStatusBadge(check.trangThai)}</td>
                                            <td>
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleViewDetail(check._id)}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center">
                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="me-2"
                                    >
                                        Trước
                                    </Button>
                                    <span className="align-self-center mx-3">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="ms-2"
                                    >
                                        Sau
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Create Check Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Tạo phiếu kiểm thuốc mới</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateCheck}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Số hóa đơn *</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={createForm.soHoaDon}
                                onChange={(e) => setCreateForm({...createForm, soHoaDon: e.target.value})}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nhà cung cấp *</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={createForm.nhaCungCap}
                                onChange={(e) => setCreateForm({...createForm, nhaCungCap: e.target.value})}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Ghi chú</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={createForm.ghiChu}
                                onChange={(e) => setCreateForm({...createForm, ghiChu: e.target.value})}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit">
                            Tạo phiếu
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Check Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Chi tiết phiếu kiểm: {selectedCheck?.maPhieuKiem}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCheck && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Số hóa đơn:</strong> {selectedCheck.soHoaDon}
                                </Col>
                                <Col md={6}>
                                    <strong>Nhà cung cấp:</strong> {selectedCheck.nhaCungCap}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Ngày kiểm:</strong> {formatDate(selectedCheck.ngayKiem)}
                                </Col>
                                <Col md={6}>
                                    <strong>Trạng thái:</strong> {getStatusBadge(selectedCheck.trangThai)}
                                </Col>
                            </Row>

                            <h5 className="mt-4">Danh sách thuốc kiểm</h5>
                            <Table responsive striped>
                                <thead>
                                    <tr>
                                        <th>Mã thuốc</th>
                                        <th>Tên thuốc</th>
                                        <th>Số lô</th>
                                        <th>Số lượng nhập</th>
                                        <th>Số lượng thực tế</th>
                                        <th>Chênh lệch</th>
                                        <th>Ghi chú</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checkDetails.map((detail) => (
                                        <tr key={detail._id}>
                                            <td>{detail.maThuoc}</td>
                                            <td>{detail.tenThuoc}</td>
                                            <td>{detail.soLo}</td>
                                            <td>{detail.soLuongNhap}</td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={detail.soLuongThucTe}
                                                    onChange={(e) => {
                                                        const newDetails = checkDetails.map(d => 
                                                            d._id === detail._id 
                                                                ? {...d, soLuongThucTe: parseInt(e.target.value) || 0}
                                                                : d
                                                        );
                                                        setCheckDetails(newDetails);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <Badge bg={detail.chenhLech === 0 ? 'success' : 'danger'}>
                                                    {detail.chenhLech}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={detail.ghiChu || ''}
                                                    onChange={(e) => {
                                                        const newDetails = checkDetails.map(d => 
                                                            d._id === detail._id 
                                                                ? {...d, ghiChu: e.target.value}
                                                                : d
                                                        );
                                                        setCheckDetails(newDetails);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        const detail = checkDetails.find(d => d._id === detail._id);
                                                        handleUpdateDetail(detail._id, detail.soLuongThucTe, detail.ghiChu);
                                                    }}
                                                >
                                                    Lưu
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Add new detail form */}
                            <Card className="mt-3">
                                <Card.Header>Thêm thuốc mới</Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleAddDetail}>
                                        <Row>
                                            <Col md={2}>
                                                <Form.Group>
                                                    <Form.Label>Mã thuốc</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        required
                                                        value={detailForm.maThuoc}
                                                        onChange={(e) => setDetailForm({...detailForm, maThuoc: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Tên thuốc</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        required
                                                        value={detailForm.tenThuoc}
                                                        onChange={(e) => setDetailForm({...detailForm, tenThuoc: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={2}>
                                                <Form.Group>
                                                    <Form.Label>Số lô</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        required
                                                        value={detailForm.soLo}
                                                        onChange={(e) => setDetailForm({...detailForm, soLo: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={2}>
                                                <Form.Group>
                                                    <Form.Label>Số lượng nhập</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        required
                                                        value={detailForm.soLuongNhap}
                                                        onChange={(e) => setDetailForm({...detailForm, soLuongNhap: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={2}>
                                                <Form.Group>
                                                    <Form.Label>Số lượng thực tế</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        required
                                                        value={detailForm.soLuongThucTe}
                                                        onChange={(e) => setDetailForm({...detailForm, soLuongThucTe: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={1}>
                                                <Form.Group>
                                                    <Form.Label>ĐVT</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        required
                                                        value={detailForm.donViTinh}
                                                        onChange={(e) => setDetailForm({...detailForm, donViTinh: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mt-2">
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Hạn dùng</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        required
                                                        value={detailForm.hanDung}
                                                        onChange={(e) => setDetailForm({...detailForm, hanDung: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Giá nhập</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        required
                                                        value={detailForm.giaNhap}
                                                        onChange={(e) => setDetailForm({...detailForm, giaNhap: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Ghi chú</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={detailForm.ghiChu}
                                                        onChange={(e) => setDetailForm({...detailForm, ghiChu: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={2} className="d-flex align-items-end">
                                                <Button variant="success" type="submit" size="sm">
                                                    Thêm
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                    {selectedCheck?.trangThai !== 'Đã kiểm' && (
                        <Button variant="success" onClick={handleCompleteCheck}>
                            Hoàn tất kiểm
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MedicineCheckManagement; 