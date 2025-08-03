import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import axiosInstance from '../../../axiosInstance';
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
        searchTerm: '',
        hanSuDung: ''
    });

    // Form states
    const [createForm, setCreateForm] = useState({
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
            
            const response = await axiosInstance.get('/api/accountant/medicine-check/checks', { params });
            setChecks(response.data.checks);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching checks:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể tải danh sách phiếu kiểm';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCheck = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/api/accountant/medicine-check/checks', createForm);
            toast.success('Tạo phiếu kiểm thành công');
            setShowCreateModal(false);
            setCreateForm({ nhaCungCap: '', ghiChu: '' });
            fetchChecks();
        } catch (error) {
            console.error('Error creating check:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể tạo phiếu kiểm';
            toast.error(errorMessage);
        }
    };

    const handleViewDetail = async (checkId) => {
        try {
            const response = await axiosInstance.get(`/api/accountant/medicine-check/checks/${checkId}`);
            setSelectedCheck(response.data.check);
            setCheckDetails(response.data.details);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching check detail:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể tải chi tiết phiếu kiểm';
            toast.error(errorMessage);
        }
    };

    const handleAddDetail = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/api/accountant/medicine-check/checks/${selectedCheck._id}/details`, detailForm);
            toast.success('Thêm chi tiết thuốc thành công');
            setDetailForm({
                maThuoc: '', tenThuoc: '', soLo: '', hanDung: '',
                soLuongNhap: '', soLuongThucTe: '', donViTinh: '', giaNhap: '', ghiChu: ''
            });
            // Refresh details
            const response = await axiosInstance.get(`/api/accountant/medicine-check/checks/${selectedCheck._id}`);
            setCheckDetails(response.data.details);
        } catch (error) {
            console.error('Error adding detail:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể thêm chi tiết thuốc';
            toast.error(errorMessage);
        }
    };

    const handleUpdateDetail = async (detailId, soLuongThucTe, ghiChu) => {
        try {
            const updateData = {
                soLuongThucTe: parseInt(soLuongThucTe) || 0
            };
            
            if (ghiChu !== undefined && ghiChu !== null) {
                updateData.ghiChu = ghiChu;
            }
            
            await axiosInstance.put(`/api/accountant/medicine-check/checks/details/${detailId}`, updateData);
            toast.success('Cập nhật thành công');
            // Refresh details
            const response = await axiosInstance.get(`/api/accountant/medicine-check/checks/${selectedCheck._id}`);
            setCheckDetails(response.data.details);
        } catch (error) {
            console.error('Error updating detail:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể cập nhật chi tiết thuốc';
            toast.error(errorMessage);
        }
    };

    const handleCompleteCheck = async () => {
        try {
            const response = await axiosInstance.put(`/api/accountant/medicine-check/checks/${selectedCheck._id}/complete`, {});
            
            let successMessage = 'Hoàn tất kiểm thuốc thành công';
            
            toast.success(successMessage);
            setShowDetailModal(false);
            fetchChecks();
        } catch (error) {
            console.error('Error completing check:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể hoàn tất kiểm thuốc';
            toast.error(errorMessage);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'Chưa kiểm': 'warning',
            'Đã kiểm': 'success',
            'Có sai lệch': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status || 'Chưa kiểm'}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const calculateDiscrepancy = (soLuongNhap, soLuongThucTe) => {
        return (soLuongThucTe || 0) - (soLuongNhap || 0);
    };

    const checkExpirationStatus = (expirationDate) => {
        const today = new Date();
        const expDate = new Date(expirationDate);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { status: 'expired', days: Math.abs(diffDays), color: 'danger' };
        } else if (diffDays <= 30) {
            return { status: 'warning', days: diffDays, color: 'warning' };
        } else {
            return { status: 'good', days: diffDays, color: 'success' };
        }
    };

    const getExpirationBadge = (expirationDate) => {
        const status = checkExpirationStatus(expirationDate);
        let text = '';
        
        switch (status.status) {
            case 'expired':
                text = `Hết hạn ${status.days} ngày`;
                break;
            case 'warning':
                text = `Còn ${status.days} ngày`;
                break;
            case 'good':
                text = `Còn ${status.days} ngày`;
                break;
            default:
                text = 'Không xác định';
        }
        
        return <Badge bg={status.color}>{text}</Badge>;
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
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Hạn sử dụng</Form.Label>
                                <Form.Select
                                    value={filters.hanSuDung}
                                    onChange={(e) => setFilters({...filters, hanSuDung: e.target.value})}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="expired">Đã hết hạn</option>
                                    <option value="warning">Sắp hết hạn (&le;30 ngày)</option>
                                    <option value="good">Còn hạn (&gt;30 ngày)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={12} className="d-flex justify-content-end">
                            <Button variant="outline-secondary" onClick={() => setFilters({trangThai: '', nhaCungCap: '', searchTerm: '', hanSuDung: ''})}>
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
                            {selectedCheck.trangThai === 'Có sai lệch' && (
                                <Row className="mb-3">
                                    <Col>
                                        <Alert variant="warning">
                                            <strong>Lưu ý:</strong> Phiếu kiểm có sai lệch về số lượng. Vui lòng kiểm tra và cập nhật số lượng thực tế.
                                        </Alert>
                                    </Col>
                                </Row>
                            )}
                            {selectedCheck.trangThai === 'Đã kiểm' && (
                                <Row className="mb-3">
                                    <Col>
                                        <Alert variant="success">
                                            <strong>✓ Hoàn tất:</strong> Phiếu kiểm đã được hoàn tất thành công.
                                        </Alert>
                                    </Col>
                                </Row>
                            )}

                            <h5 className="mt-4">Danh sách thuốc kiểm</h5>
                            
                            {/* Thống kê hạn sử dụng */}
                            {checkDetails.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Body>
                                        <Row>
                                            <Col md={3}>
                                                <div className="text-center">
                                                    <Badge bg="success" className="mb-2">
                                                        {checkDetails.filter(d => checkExpirationStatus(d.hanDung).status === 'good').length}
                                                    </Badge>
                                                    <div className="small">Còn hạn</div>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="text-center">
                                                    <Badge bg="warning" className="mb-2">
                                                        {checkDetails.filter(d => checkExpirationStatus(d.hanDung).status === 'warning').length}
                                                    </Badge>
                                                    <div className="small">Sắp hết hạn</div>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="text-center">
                                                    <Badge bg="danger" className="mb-2">
                                                        {checkDetails.filter(d => checkExpirationStatus(d.hanDung).status === 'expired').length}
                                                    </Badge>
                                                    <div className="small">Đã hết hạn</div>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="text-center">
                                                    <Badge bg="info" className="mb-2">
                                                        {checkDetails.length}
                                                    </Badge>
                                                    <div className="small">Tổng cộng</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}
                            
                            <Table responsive striped>
                                <thead>
                                    <tr>
                                        <th>Mã thuốc</th>
                                        <th>Tên thuốc</th>
                                        <th>Số lô</th>
                                        <th>Hạn sử dụng</th>
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
                                            <td>
                                                <div>
                                                    <div>{formatDate(detail.hanDung)}</div>
                                                    {getExpirationBadge(detail.hanDung)}
                                                </div>
                                            </td>
                                            <td>{detail.soLuongNhap}</td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={detail.soLuongThucTe || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                                        const newDetails = checkDetails.map(d => 
                                                            d._id === detail._id 
                                                                ? {
                                                                    ...d, 
                                                                    soLuongThucTe: value,
                                                                    chenhLech: value - (d.soLuongNhap || 0),
                                                                    coSaiLech: value !== (d.soLuongNhap || 0)
                                                                }
                                                                : d
                                                        );
                                                        setCheckDetails(newDetails);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <Badge bg={calculateDiscrepancy(detail.soLuongNhap, detail.soLuongThucTe) === 0 ? 'success' : 'danger'}>
                                                    {calculateDiscrepancy(detail.soLuongNhap, detail.soLuongThucTe)}
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
                                                                ? {...d, ghiChu: e.target.value || ''}
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
                                                        const currentDetail = checkDetails.find(d => d._id === detail._id);
                                                        if (currentDetail && currentDetail.soLuongThucTe !== undefined) {
                                                            handleUpdateDetail(currentDetail._id, currentDetail.soLuongThucTe, currentDetail.ghiChu);
                                                        } else {
                                                            toast.error('Vui lòng nhập số lượng thực tế');
                                                        }
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
                                                    <Form.Label>Hạn sử dụng</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        required
                                                        value={detailForm.hanDung}
                                                        onChange={(e) => setDetailForm({...detailForm, hanDung: e.target.value})}
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
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Giá nhập (VNĐ)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        required
                                                        value={detailForm.giaNhap}
                                                        onChange={(e) => setDetailForm({...detailForm, giaNhap: e.target.value})}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
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
                    {selectedCheck?.trangThai === 'Chưa kiểm' && checkDetails.length > 0 && (
                        <Button variant="success" onClick={handleCompleteCheck}>
                            Hoàn tất kiểm
                        </Button>
                    )}
                    {selectedCheck?.trangThai === 'Chưa kiểm' && checkDetails.length === 0 && (
                        <Alert variant="warning" className="mb-0">
                            <strong>⚠️ Lưu ý:</strong> Chưa có thuốc nào trong phiếu kiểm. Vui lòng thêm thuốc trước khi hoàn tất.
                        </Alert>
                    )}
                    {selectedCheck?.trangThai === 'Có sai lệch' && (
                        <Button variant="warning" onClick={handleCompleteCheck}>
                            Hoàn tất kiểm (Có sai lệch)
                        </Button>
                    )}
                    {selectedCheck?.trangThai === 'Đã kiểm' && (
                        <div className="d-flex align-items-center">
                            <Alert variant="success" className="mb-0">
                                <strong>✓ Hoàn tất:</strong> Phiếu kiểm đã được hoàn tất thành công.
                            </Alert>
                        </div>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MedicineCheckManagement; 