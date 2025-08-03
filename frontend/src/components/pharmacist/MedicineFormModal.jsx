import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Badge } from "react-bootstrap";
import axiosInstance from "../../../axiosInstance";

const MedicineFormModal = ({ show, onHide, onSubmit, editMedicine, emptyMedicine }) => {
    const [form, setForm] = useState(emptyMedicine);
    const [showCheckedMedicines, setShowCheckedMedicines] = useState(false);
    const [checkedMedicines, setCheckedMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        showInInventory: 'all', // 'all', 'in', 'not-in'
        searchTerm: '',
        checkStatus: 'all' // 'all', 'checked', 'discrepancy'
    });

    useEffect(() => {
        if (show) {
            setForm(editMedicine
                ? {
                    ...emptyMedicine,
                    ...editMedicine,
                    expirationDate: editMedicine.expirationDate
                        ? editMedicine.expirationDate.slice(0, 10)
                        : ""
                }
                : emptyMedicine
            );
        }
    }, [show, editMedicine, emptyMedicine]);

    // Lọc thuốc dựa trên filter
    useEffect(() => {
        let filtered = checkedMedicines;

        // Lọc theo trạng thái trong kho
        if (filters.showInInventory === 'in') {
            filtered = filtered.filter(medicine => medicine.alreadyInInventory);
        } else if (filters.showInInventory === 'not-in') {
            filtered = filtered.filter(medicine => !medicine.alreadyInInventory);
        }

        // Lọc theo trạng thái kiểm thuốc
        if (filters.checkStatus === 'checked') {
            filtered = filtered.filter(medicine => !medicine.medicineDetail.coSaiLech);
        } else if (filters.checkStatus === 'discrepancy') {
            filtered = filtered.filter(medicine => medicine.medicineDetail.coSaiLech);
        }

        // Lọc theo từ khóa tìm kiếm
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(medicine => 
                medicine.name.toLowerCase().includes(searchTerm) ||
                medicine.medicineId.toLowerCase().includes(searchTerm) ||
                medicine.checkInfo.nhaCungCap.toLowerCase().includes(searchTerm) ||
                medicine.checkInfo.soHoaDon.toLowerCase().includes(searchTerm) ||
                medicine.medicineDetail.soLo.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredMedicines(filtered);
    }, [checkedMedicines, filters]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const fetchCheckedMedicines = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/api/accountant/medicine-check/medicines/available');
            setCheckedMedicines(response.data.availableMedicines || []);
            setShowCheckedMedicines(true);
        } catch (error) {
            console.error('Error fetching checked medicines:', error);
            setError('Không thể tải danh sách thuốc đã kiểm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const selectCheckedMedicine = (medicine) => {
        // Tự động điền các trường có sẵn từ dữ liệu kiểm thuốc
        const autoFilledForm = {
            ...form,
            // Các trường có sẵn từ kiểm thuốc
            medicineId: medicine.medicineId,
            name: medicine.name,
            expirationDate: medicine.expirationDate ? medicine.expirationDate.slice(0, 10) : "",
            quantity: medicine.quantity,
            unitPrice: medicine.unitPrice,
            note: medicine.note || medicine.ghiChu || medicine.medicineDetail.ghiChu || "",
            
            // Các trường có thể có sẵn hoặc để trống để nhập tay
            type: medicine.type || "",
            group: medicine.group || "",
            ingredient: medicine.ingredient || "",
            indication: medicine.indication || "",
            contraindication: medicine.contraindication || "",
            dosage: medicine.dosage || "",
            sideEffects: medicine.sideEffects || "",
            precaution: medicine.precaution || "",
            interaction: medicine.interaction || "",
            storage: medicine.storage || "",
            
            // Thêm thông tin bổ sung từ kiểm thuốc
            supplier: medicine.checkInfo?.nhaCungCap || "",
            soLo: medicine.soLo || medicine.medicineDetail.soLo || "",
            donViTinh: medicine.donViTinh || medicine.medicineDetail.donViTinh || "",
            checkInfo: {
                maPhieuKiem: medicine.checkInfo?.maPhieuKiem || "",
                soHoaDon: medicine.checkInfo?.soHoaDon || "",
                ngayKiem: medicine.checkInfo?.ngayKiem || "",
                nguoiKiem: medicine.checkInfo?.nguoiKiem || ""
            }
        };
        
        setForm(autoFilledForm);
        setShowCheckedMedicines(false);
        
        // Hiển thị thông báo chi tiết về phiếu kiểm
        let message = `✅ Đã tự động điền thông tin từ phiếu kiểm thuốc!\n\n`;
        message += `📋 Phiếu kiểm: ${medicine.checkInfo?.maPhieuKiem}\n`;
        message += `🏥 Nhà cung cấp: ${medicine.checkInfo?.nhaCungCap}\n`;
        message += `📄 Hóa đơn: ${medicine.checkInfo?.soHoaDon}\n`;
        message += `📦 Số lô: ${medicine.medicineDetail.soLo}\n`;
        message += `📊 Số lượng thực tế: ${medicine.medicineDetail.soLuongThucTe} ${medicine.medicineDetail.donViTinh}\n`;
        
        if (medicine.medicineDetail.coSaiLech) {
            message += `⚠️ Có sai lệch: ${medicine.medicineDetail.chenhLech} ${medicine.medicineDetail.donViTinh}\n`;
        }
        
        // Hiển thị thông báo về các trường cần nhập thêm
        const emptyFields = [];
        if (!medicine.type) emptyFields.push("Loại thuốc");
        if (!medicine.ingredient) emptyFields.push("Hoạt chất");
        if (!medicine.indication) emptyFields.push("Chỉ định");
        if (!medicine.dosage) emptyFields.push("Liều dùng");
        if (!medicine.storage) emptyFields.push("Bảo quản");
        
        if (emptyFields.length > 0) {
            message += `\n📝 Các trường cần nhập thêm:\n${emptyFields.join(', ')}\n\nVui lòng kiểm tra và bổ sung thông tin còn thiếu.`;
        } else {
            message += `\n✅ Thông tin đã đầy đủ!`;
        }
        
        alert(message);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Kiểm tra trước khi nhập kho (theo quy trình PDF)
        if (!form.medicineId || !form.name || !form.quantity || form.quantity <= 0 || !form.unitPrice || form.unitPrice <= 0) {
            alert("Vui lòng điền đầy đủ mã thuốc, tên, số lượng và giá hợp lệ!");
            return;
        }
        if (form.expirationDate && new Date(form.expirationDate) <= new Date()) {
            alert("Hạn sử dụng phải lớn hơn ngày hiện tại!");
            return;
        }
        onSubmit(form);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getInventoryBadge = (alreadyInInventory) => {
        return alreadyInInventory ? 
            <Badge bg="success">Đã có trong kho</Badge> : 
            <Badge bg="warning">Chưa có trong kho</Badge>;
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editMedicine ? "Sửa thuốc" : "Thêm thuốc mới"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {!editMedicine && (
                            <div className="mb-3">
                                <Button 
                                    variant="outline-primary" 
                                    className="btn-fetch-checked"
                                    onClick={fetchCheckedMedicines}
                                    disabled={loading}
                                >
                                    {loading && <span className="loading-spinner"></span>}
                                    {loading ? 'Đang tải...' : '📋 Lấy dữ liệu từ thuốc đã kiểm'}
                                </Button>
                                {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                            </div>
                        )}
                        
                        <div className="row">
                            <Form.Group className="mb-2">
                                <Form.Label>Mã thuốc *</Form.Label>
                                <Form.Control 
                                    required 
                                    name="medicineId" 
                                    value={form.medicineId ?? ""} 
                                    onChange={handleChange}
                                    placeholder="VD: PARACETAMOL001"
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Tên thuốc *</Form.Label>
                                <Form.Control required name="name" value={form.name ?? ""} onChange={handleChange} />
                            </Form.Group>
                            
                            {/* Hiển thị thông tin từ phiếu kiểm nếu có */}
                            {form.checkInfo && (
                                <div className="col-12 mb-3">
                                    <div className="alert alert-info">
                                        <h6>📋 Thông tin từ phiếu kiểm thuốc:</h6>
                                        <div className="row">
                                            <div className="col-md-2">
                                                <strong>Phiếu kiểm:</strong><br/>
                                                <span className="text-primary">{form.checkInfo.maPhieuKiem}</span>
                                            </div>
                                            <div className="col-md-2">
                                                <strong>Hóa đơn:</strong><br/>
                                                <span className="text-primary">{form.checkInfo.soHoaDon}</span>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>Nhà cung cấp:</strong><br/>
                                                <span className="text-primary">{form.supplier}</span>
                                            </div>
                                            <div className="col-md-2">
                                                <strong>Số lô:</strong><br/>
                                                <span className="text-primary">{form.soLo}</span>
                                            </div>
                                            <div className="col-md-2">
                                                <strong>Người kiểm:</strong><br/>
                                                <span className="text-primary">{form.checkInfo.nguoiKiem || 'N/A'}</span>
                                            </div>
                                            <div className="col-md-1">
                                                <strong>Ngày kiểm:</strong><br/>
                                                <span className="text-primary">{form.checkInfo.ngayKiem ? new Date(form.checkInfo.ngayKiem).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Form.Group className="mb-2">
                                <Form.Label>Loại</Form.Label>
                                <Form.Control name="type" value={form.type ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Hoạt chất</Form.Label>
                                <Form.Control name="ingredient" value={form.ingredient ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Nhóm thuốc</Form.Label>
                                <Form.Control name="group" value={form.group ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Hạn sử dụng</Form.Label>
                                <Form.Control type="date" name="expirationDate" value={form.expirationDate ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Chỉ định</Form.Label>
                                <Form.Control name="indication" value={form.indication ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Chống chỉ định</Form.Label>
                                <Form.Control name="contraindication" value={form.contraindication ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Liều dùng</Form.Label>
                                <Form.Control name="dosage" value={form.dosage ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Tác dụng phụ</Form.Label>
                                <Form.Control name="sideEffects" value={form.sideEffects ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Thận trọng</Form.Label>
                                <Form.Control name="precaution" value={form.precaution ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Tương tác</Form.Label>
                                <Form.Control name="interaction" value={form.interaction ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Bảo quản</Form.Label>
                                <Form.Control name="storage" value={form.storage ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Chú ý</Form.Label>
                                <Form.Control name="note" value={form.note ?? ""} onChange={handleChange} />
                            </Form.Group>
                            <div className="row">
                                <div className="col-6">
                                    <Form.Group className="mb-2">
                                        <Form.Label>Số lượng</Form.Label>
                                        <Form.Control type="number" min={0} name="quantity" value={form.quantity ?? ""} onChange={handleChange} />
                                    </Form.Group>
                                </div>
                                <div className="col-6">
                                    <Form.Group className="mb-2">
                                        <Form.Label>Đơn giá (VNĐ)</Form.Label>
                                        <Form.Control type="number" min={0} name="unitPrice" value={form.unitPrice ?? ""} onChange={handleChange} />
                                    </Form.Group>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide}>Đóng</Button>
                        <Button variant="primary" type="submit">{editMedicine ? "Lưu thay đổi" : "Thêm mới"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal hiển thị danh sách thuốc đã được kiểm */}
            <Modal 
                show={showCheckedMedicines} 
                onHide={() => setShowCheckedMedicines(false)} 
                size="xl"
                className="checked-medicines-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chọn thuốc từ danh sách đã kiểm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Bộ lọc */}
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Tên thuốc, mã thuốc, nhà cung cấp..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Trạng thái trong kho</Form.Label>
                                <Form.Select
                                    value={filters.showInInventory}
                                    onChange={(e) => setFilters({...filters, showInInventory: e.target.value})}
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="not-in">Chưa có trong kho</option>
                                    <option value="in">Đã có trong kho</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Trạng thái kiểm</Form.Label>
                                <Form.Select
                                    value={filters.checkStatus}
                                    onChange={(e) => setFilters({...filters, checkStatus: e.target.value})}
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="checked">Đã kiểm đúng</option>
                                    <option value="discrepancy">Có sai lệch</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-3 d-flex align-items-end">
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => setFilters({showInInventory: 'all', searchTerm: '', checkStatus: 'all'})}
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>

                    {filteredMedicines.length === 0 ? (
                        <Alert variant="info">
                            {checkedMedicines.length === 0 
                                ? "Không có thuốc nào đã được kiểm và sẵn sàng thêm vào kho."
                                : "Không tìm thấy thuốc nào phù hợp với bộ lọc."
                            }
                        </Alert>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Mã thuốc</th>
                                        <th>Tên thuốc</th>
                                        <th>Nhà cung cấp</th>
                                        <th>Số hóa đơn</th>
                                        <th>Số lô</th>
                                        <th>Số lượng</th>
                                        <th>Đơn giá</th>
                                        <th>Hạn sử dụng</th>
                                        <th>Trạng thái kiểm</th>
                                        <th>Thông tin có sẵn</th>
                                        <th>Trạng thái kho</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMedicines.map((medicine, index) => (
                                        <tr key={index}>
                                            <td>
                                                <strong>{medicine.medicineId}</strong>
                                                <br/>
                                                <small className="text-muted">{medicine.medicineDetail.maThuoc}</small>
                                            </td>
                                            <td>
                                                <strong>{medicine.name}</strong>
                                                <br/>
                                                <small className="text-muted">Số lô: {medicine.medicineDetail.soLo}</small>
                                            </td>
                                            <td>
                                                <div>{medicine.checkInfo.nhaCungCap}</div>
                                                <small className="text-muted">Người kiểm: {medicine.checkInfo.nguoiKiem}</small>
                                            </td>
                                            <td>
                                                <div>{medicine.checkInfo.soHoaDon}</div>
                                                <small className="text-muted">
                                                    {medicine.checkInfo.ngayKiem ? new Date(medicine.checkInfo.ngayKiem).toLocaleDateString('vi-VN') : 'N/A'}
                                                </small>
                                            </td>
                                            <td>
                                                <div>{medicine.medicineDetail.soLo}</div>
                                                <small className="text-muted">{medicine.medicineDetail.donViTinh}</small>
                                            </td>
                                            <td>
                                                <div>
                                                    <span className="text-primary">{medicine.medicineDetail.soLuongThucTe}</span>
                                                    <small className="text-muted"> / {medicine.medicineDetail.soLuongNhap}</small>
                                                </div>
                                                <small className="text-muted">{medicine.medicineDetail.donViTinh}</small>
                                            </td>
                                            <td>{medicine.unitPrice?.toLocaleString('vi-VN')} VNĐ</td>
                                            <td>{formatDate(medicine.expirationDate)}</td>
                                            <td>
                                                {medicine.medicineDetail.coSaiLech ? (
                                                    <div>
                                                        <Badge bg="danger" className="me-1">Có sai lệch</Badge>
                                                        <small className="text-muted d-block">
                                                            Chênh lệch: {medicine.medicineDetail.chenhLech}
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <Badge bg="success">Đã kiểm đúng</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <div className="small">
                                                    {medicine.type && <Badge bg="success" className="me-1">Loại</Badge>}
                                                    {medicine.ingredient && <Badge bg="success" className="me-1">Hoạt chất</Badge>}
                                                    {medicine.indication && <Badge bg="success" className="me-1">Chỉ định</Badge>}
                                                    {medicine.dosage && <Badge bg="success" className="me-1">Liều dùng</Badge>}
                                                    {medicine.storage && <Badge bg="success" className="me-1">Bảo quản</Badge>}
                                                    {!medicine.type && !medicine.ingredient && !medicine.indication && !medicine.dosage && !medicine.storage && (
                                                        <Badge bg="warning">Cần nhập thêm</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{getInventoryBadge(medicine.alreadyInInventory)}</td>
                                            <td>
                                                <Button 
                                                    variant="success" 
                                                    size="sm"
                                                    className="btn-select"
                                                    onClick={() => selectCheckedMedicine(medicine)}
                                                    disabled={medicine.alreadyInInventory}
                                                >
                                                    {medicine.alreadyInInventory ? 'Đã có' : 'Chọn'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between w-100">
                        <div>
                            <small className="text-muted">
                                Hiển thị {filteredMedicines.length} / {checkedMedicines.length} thuốc
                            </small>
                        </div>
                        <Button variant="secondary" onClick={() => setShowCheckedMedicines(false)}>
                            Đóng
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MedicineFormModal;

// Thêm CSS styles
const styles = `
<style>
.checked-medicines-modal .modal-xl {
    max-width: 95%;
}

.checked-medicines-modal .table th {
    background-color: #f8f9fa;
    border-top: none;
    font-weight: 600;
    font-size: 0.9rem;
}

.checked-medicines-modal .table td {
    vertical-align: middle;
    font-size: 0.9rem;
}

.btn-fetch-checked {
    background: linear-gradient(45deg, #007bff, #0056b3);
    border: none;
    color: white;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.btn-fetch-checked:hover {
    background: linear-gradient(45deg, #0056b3, #004085);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,123,255,0.3);
}

.btn-fetch-checked:disabled {
    background: #6c757d;
    transform: none;
    box-shadow: none;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.alert-info {
    background: linear-gradient(135deg, #d1ecf1, #bee5eb);
    border: 1px solid #bee5eb;
    border-radius: 8px;
}

.alert-info h6 {
    color: #0c5460;
    margin-bottom: 15px;
    font-weight: 600;
}

.text-primary {
    color: #007bff !important;
    font-weight: 500;
}

.btn-select {
    transition: all 0.2s ease;
}

.btn-select:hover:not(:disabled) {
    transform: scale(1.05);
}

.badge {
    font-size: 0.75rem;
}

.table-responsive {
    max-height: 500px;
    overflow-y: auto;
}

.small {
    font-size: 0.8rem;
}

.text-muted {
    color: #6c757d !important;
}
</style>
`;

// Thêm styles vào document head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}