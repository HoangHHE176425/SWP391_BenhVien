import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../assets/css/AccountantMedicineManagement.css';

const AccountantMedicineManagement = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);

    // States cho tạo phiếu kiểm thuốc
    const [showCreateCheckModal, setShowCreateCheckModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [checkDetails, setCheckDetails] = useState([]);
    const [availableMedicines, setAvailableMedicines] = useState([]);
    const [selectedMedicineForCheck, setSelectedMedicineForCheck] = useState(null);
    const [medicineForm, setMedicineForm] = useState({
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
        console.log('AccountantMedicineManagement component mounted');
        fetchMedicines();
        fetchSuppliers();
    }, [currentPage, searchTerm, filterMode]);

    const fetchMedicines = async () => {
        console.log('Fetching medicines...');
        setLoading(true);
        try {
            // Thử API khác nhau
            const response = await axios.get('/api/medicine/medicines', {
                params: {
                    page: currentPage,
                    limit: 10,
                    searchTerm,
                    filterMode,
                },
            });
            
            console.log('API response:', response.data);
            
            if (Array.isArray(response.data.medicines)) {
                setMedicines(response.data.medicines);
                setTotalPages(response.data.totalPages || 0);
            } else {
                setMedicines([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            // Fallback data nếu API không hoạt động
            const fallbackData = [
                {
                    _id: '1',
                    name: 'Paracetamol 500mg',
                    type: 'Thuốc giảm đau',
                    quantity: 100,
                    unitPrice: 5000,
                    isActive: true,
                    group: 'Thuốc giảm đau',
                    ingredient: 'Paracetamol',
                    indication: 'Giảm đau, hạ sốt',
                    contraindication: 'Không dùng cho người dị ứng',
                    dosage: '1-2 viên/lần',
                    sideEffects: 'Buồn nôn, chóng mặt',
                    storage: 'Nơi khô ráo, thoáng mát',
                    expirationDate: '2025-12-31'
                },
                {
                    _id: '2',
                    name: 'Amoxicillin 500mg',
                    type: 'Thuốc kháng sinh',
                    quantity: 50,
                    unitPrice: 15000,
                    isActive: true,
                    group: 'Thuốc kháng sinh',
                    ingredient: 'Amoxicillin',
                    indication: 'Điều trị nhiễm khuẩn',
                    contraindication: 'Không dùng cho người dị ứng penicillin',
                    dosage: '1 viên/8 giờ',
                    sideEffects: 'Tiêu chảy, buồn nôn',
                    storage: 'Bảo quản trong tủ lạnh',
                    expirationDate: '2024-06-30'
                }
            ];
            console.log('Using fallback data:', fallbackData);
            setMedicines(fallbackData);
            setTotalPages(1);
            toast.warning('Sử dụng dữ liệu mẫu do API không khả dụng');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            // Giả sử có API để lấy danh sách nhà cung cấp
            const response = await axios.get('/api/accountant/suppliers');
            setSuppliers(response.data.suppliers || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            // Fallback data
            setSuppliers([
                { id: '1', name: 'Công ty Dược phẩm ABC' },
                { id: '2', name: 'Công ty Dược phẩm XYZ' },
                { id: '3', name: 'Công ty Dược phẩm DEF' }
            ]);
        }
    };

    const handleCreateCheck = () => {
        setShowCreateCheckModal(true);
        setCheckDetails([]);
        setSelectedSupplier('');
        setInvoiceNumber('');
        setMedicineForm({
            maThuoc: '', tenThuoc: '', soLo: '', hanDung: '',
            soLuongNhap: '', soLuongThucTe: '', donViTinh: '', giaNhap: '', ghiChu: ''
        });
    };

    const handleAddMedicineToCheck = () => {
        if (!medicineForm.maThuoc || !medicineForm.tenThuoc || !medicineForm.soLuongNhap) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const newDetail = {
            id: Date.now(), // Temporary ID
            ...medicineForm,
            soLuongThucTe: medicineForm.soLuongThucTe || medicineForm.soLuongNhap
        };

        setCheckDetails([...checkDetails, newDetail]);
        setMedicineForm({
            maThuoc: '', tenThuoc: '', soLo: '', hanDung: '',
            soLuongNhap: '', soLuongThucTe: '', donViTinh: '', giaNhap: '', ghiChu: ''
        });
        toast.success('Đã thêm thuốc vào phiếu kiểm');
    };

    const handleRemoveMedicineFromCheck = (index) => {
        const updatedDetails = checkDetails.filter((_, i) => i !== index);
        setCheckDetails(updatedDetails);
        toast.success('Đã xóa thuốc khỏi phiếu kiểm');
    };

    const handleSubmitCheck = async () => {
        if (!selectedSupplier || !invoiceNumber || checkDetails.length === 0) {
            toast.error('Vui lòng điền đầy đủ thông tin phiếu kiểm');
            return;
        }

        try {
            const checkData = {
                nhaCungCap: selectedSupplier,
                soHoaDon: invoiceNumber,
                ghiChu: '',
                details: checkDetails
            };

            await axios.post('/api/accountant/medicine-check/checks', checkData);
            toast.success('Tạo phiếu kiểm thuốc thành công');
            setShowCreateCheckModal(false);
            fetchMedicines(); // Refresh danh sách
        } catch (error) {
            console.error('Error creating medicine check:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo phiếu kiểm thuốc');
        }
    };

    const handleViewDetail = (medicine) => {
        setSelectedMedicine(medicine);
        setShowDetailModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (error) {
            return 'N/A';
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (isActive) => {
        return isActive ? 
            <Badge className="status-badge success">Đang kinh doanh</Badge> : 
            <Badge className="status-badge danger">Ngừng kinh doanh</Badge>;
    };

    const getStockStatus = (quantity) => {
        if (quantity <= 0) return <Badge className="status-badge danger">Hết hàng</Badge>;
        if (quantity < 10) return <Badge className="status-badge warning">Sắp hết</Badge>;
        return <Badge className="status-badge success">Còn hàng</Badge>;
    };

    console.log('Rendering AccountantMedicineManagement, medicines:', medicines);
    
    return (
        <Container fluid className="accountant-medicine-container">
            <Row className="mb-4">
                <Col>
                    <h2 className="accountant-medicine-title">Quản Lý Thuốc</h2>
                </Col>
                <Col xs="auto">
                    <Button 
                        variant="primary" 
                        onClick={handleCreateCheck}
                        className="me-2 create-check-btn"
                    >
                        <i className="fas fa-plus me-2"></i>
                        Tạo phiếu kiểm thuốc
                    </Button>
                </Col>
            </Row>

            {/* Debug Info */}
            <Row className="mb-3">
                <Col>
                    <div className="debug-info">
                        <strong>Debug Info:</strong> 
                        <br />
                        Medicines count: <strong>{medicines.length}</strong>, 
                        Loading: <strong>{loading ? 'Yes' : 'No'}</strong>, 
                        Current page: <strong>{currentPage}</strong>
                        <br />
                        Search term: <strong>"{searchTerm}"</strong>, 
                        Filter mode: <strong>"{filterMode}"</strong>
                    </div>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4 filter-card">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="form-label">Tìm kiếm</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm theo tên thuốc..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="form-label">Bộ lọc</Form.Label>
                                <Form.Select
                                    value={filterMode}
                                    onChange={(e) => setFilterMode(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="active">Đang kinh doanh</option>
                                    <option value="inactive">Ngừng kinh doanh</option>
                                    <option value="low-stock">Sắp hết hàng</option>
                                    <option value="out-of-stock">Hết hàng</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterMode('all');
                                }}
                                className="clear-filter-btn"
                            >
                                <i className="fas fa-times me-1"></i>
                                Xóa bộ lọc
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Medicines Table */}
            <Card className="medicine-table-card">
                <Card.Body>
                    {loading ? (
                        <div className="text-center loading-container">
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            Đang tải...
                        </div>
                    ) : (
                        <>
                            <Table responsive striped hover className="medicine-table">
                                <thead>
                                    <tr>
                                        <th>Mã thuốc</th>
                                        <th>Tên thuốc</th>
                                        <th>Loại</th>
                                        <th>Số lượng</th>
                                        <th>Giá bán</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicines.length > 0 ? (
                                        medicines.map((medicine, index) => (
                                            <tr key={medicine._id}>
                                                <td>{medicine._id}</td>
                                                <td>{medicine.name}</td>
                                                <td className="text-muted">{medicine.type}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className="me-2" style={{ fontWeight: '500' }}>{medicine.quantity}</span>
                                                        {getStockStatus(medicine.quantity)}
                                                    </div>
                                                </td>
                                                <td className="text-success">{formatCurrency(medicine.unitPrice)}</td>
                                                <td>{getStatusBadge(medicine.isActive)}</td>
                                                <td>
                                                    <Button
                                                        variant="info"
                                                        size="sm"
                                                        onClick={() => handleViewDetail(medicine)}
                                                        className="detail-btn"
                                                    >
                                                        Chi tiết
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center no-data-row">
                                                <i className="fas fa-info-circle me-2"></i>
                                                Không có dữ liệu thuốc
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            {medicines.length === 0 && (
                                <div className="text-center text-muted no-data-message">
                                    <i className="fas fa-search me-2"></i>
                                    Không tìm thấy thuốc nào
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3 pagination-container">
                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="me-2 pagination-btn"
                                    >
                                        <i className="fas fa-chevron-left me-1"></i>
                                        Trước
                                    </Button>
                                    <span className="align-self-center mx-3 pagination-info">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="ms-2 pagination-btn"
                                    >
                                        Sau
                                        <i className="fas fa-chevron-right ms-1"></i>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Medicine Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" className="medicine-detail-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết thuốc</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMedicine && (
                        <Row>
                            <Col md={6}>
                                <p><strong>Mã thuốc:</strong> {selectedMedicine._id}</p>
                                <p><strong>Tên thuốc:</strong> {selectedMedicine.name}</p>
                                <p><strong>Loại:</strong> {selectedMedicine.type}</p>
                                <p><strong>Nhóm:</strong> {selectedMedicine.group}</p>
                                <p><strong>Hoạt chất:</strong> {selectedMedicine.ingredient}</p>
                                <p><strong>Số lượng:</strong> {selectedMedicine.quantity}</p>
                                <p><strong>Giá bán:</strong> {formatCurrency(selectedMedicine.unitPrice)}</p>
                            </Col>
                            <Col md={6}>
                                <p><strong>Chỉ định:</strong> {selectedMedicine.indication}</p>
                                <p><strong>Chống chỉ định:</strong> {selectedMedicine.contraindication}</p>
                                <p><strong>Liều dùng:</strong> {selectedMedicine.dosage}</p>
                                <p><strong>Tác dụng phụ:</strong> {selectedMedicine.sideEffects}</p>
                                <p><strong>Bảo quản:</strong> {selectedMedicine.storage}</p>
                                <p><strong>Hạn sử dụng:</strong> {formatDate(selectedMedicine.expirationDate)}</p>
                                <p><strong>Trạng thái:</strong> {getStatusBadge(selectedMedicine.isActive)}</p>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create Medicine Check Modal */}
            <Modal 
                show={showCreateCheckModal} 
                onHide={() => setShowCreateCheckModal(false)} 
                size="xl"
                scrollable
                className="medicine-check-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Tạo phiếu kiểm thuốc mới</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h6>Thông tin phiếu kiểm</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nhà cung cấp *</Form.Label>
                                        <Form.Select
                                            value={selectedSupplier}
                                            onChange={(e) => setSelectedSupplier(e.target.value)}
                                            required
                                        >
                                            <option value="">Chọn nhà cung cấp</option>
                                            {suppliers.map(supplier => (
                                                <option key={supplier.id} value={supplier.name}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Số hóa đơn *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            placeholder="Nhập số hóa đơn"
                                            required
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header>
                                    <h6>Thêm thuốc vào phiếu kiểm</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Mã thuốc *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={medicineForm.maThuoc}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        maThuoc: e.target.value
                                                    })}
                                                    placeholder="Mã thuốc"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Tên thuốc *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={medicineForm.tenThuoc}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        tenThuoc: e.target.value
                                                    })}
                                                    placeholder="Tên thuốc"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Số lô</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={medicineForm.soLo}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        soLo: e.target.value
                                                    })}
                                                    placeholder="Số lô"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Hạn dùng</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={medicineForm.hanDung}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        hanDung: e.target.value
                                                    })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Số lượng nhập *</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={medicineForm.soLuongNhap}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        soLuongNhap: e.target.value
                                                    })}
                                                    placeholder="Số lượng"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Số lượng thực tế</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={medicineForm.soLuongThucTe}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        soLuongThucTe: e.target.value
                                                    })}
                                                    placeholder="Số lượng thực tế"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Đơn vị tính</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={medicineForm.donViTinh}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        donViTinh: e.target.value
                                                    })}
                                                    placeholder="Viên, chai, gói..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Giá nhập</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={medicineForm.giaNhap}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        giaNhap: e.target.value
                                                    })}
                                                    placeholder="Giá nhập"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Ghi chú</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={medicineForm.ghiChu}
                                                    onChange={(e) => setMedicineForm({
                                                        ...medicineForm,
                                                        ghiChu: e.target.value
                                                    })}
                                                    placeholder="Ghi chú"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Button 
                                        variant="success" 
                                        onClick={handleAddMedicineToCheck}
                                        className="w-100 add-medicine-btn"
                                    >
                                        <i className="fas fa-plus me-2"></i>
                                        Thêm thuốc vào phiếu kiểm
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <h6>Danh sách thuốc trong phiếu kiểm</h6>
                                </Card.Header>
                                <Card.Body>
                                    {checkDetails.length === 0 ? (
                                        <div className="text-center text-muted">
                                            Chưa có thuốc nào trong phiếu kiểm
                                        </div>
                                    ) : (
                                        <div className="medicine-check-list">
                                            {checkDetails.map((detail, index) => (
                                                <div key={detail.id} className="medicine-check-item">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-1">{detail.tenThuoc}</h6>
                                                            <p className="mb-1 text-muted">
                                                                <small>Mã: {detail.maThuoc}</small>
                                                            </p>
                                                            <div className="row">
                                                                <div className="col-6">
                                                                    <small>
                                                                        <strong>Số lượng nhập:</strong> {detail.soLuongNhap} {detail.donViTinh}
                                                                    </small>
                                                                </div>
                                                                <div className="col-6">
                                                                    <small>
                                                                        <strong>Số lượng thực tế:</strong> {detail.soLuongThucTe} {detail.donViTinh}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                            {detail.soLo && (
                                                                <small className="d-block">
                                                                    <strong>Số lô:</strong> {detail.soLo}
                                                                </small>
                                                            )}
                                                            {detail.hanDung && (
                                                                <small className="d-block">
                                                                    <strong>Hạn dùng:</strong> {formatDate(detail.hanDung)}
                                                                </small>
                                                            )}
                                                            {detail.giaNhap && (
                                                                <small className="d-block">
                                                                    <strong>Giá nhập:</strong> {formatCurrency(detail.giaNhap)}
                                                                </small>
                                                            )}
                                                            {detail.ghiChu && (
                                                                <small className="d-block">
                                                                    <strong>Ghi chú:</strong> {detail.ghiChu}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveMedicineFromCheck(index)}
                                                            className="remove-medicine-btn"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateCheckModal(false)}>
                        Hủy
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitCheck}
                        disabled={!selectedSupplier || !invoiceNumber || checkDetails.length === 0}
                        className="save-check-btn"
                    >
                        <i className="fas fa-save me-2"></i>
                        Lưu phiếu kiểm thuốc
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AccountantMedicineManagement; 