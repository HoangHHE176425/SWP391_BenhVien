/* eslint-disable */
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const PharmacyTransactionModal = ({ show, onHide, medicines, patients = [], onSubmit }) => {
    const [transactionItems, setTransactionItems] = useState([{ medicineId: "", quantity: "" }]);
    const [patientSelection, setPatientSelection] = useState(""); // Tracks "Chọn bệnh nhân" or "Không phải bệnh nhân"
    const [cccd, setCccd] = useState("");
    const [selectedRecord, setSelectedRecord] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("tien mat");
    const [error, setError] = useState(null);

    const handleAddTransactionItem = () => {
        setTransactionItems([...transactionItems, { medicineId: "", quantity: "" }]);
    };

    const handleTransactionItemChange = (index, field, value) => {
        const updatedItems = [...transactionItems];
        updatedItems[index][field] = value;
        setTransactionItems(updatedItems);
    };

    const handleRemoveTransactionItem = (index) => {
        setTransactionItems(transactionItems.filter((_, i) => i !== index));
    };

    // Hàm kiểm tra thuốc có hợp lệ hay không
    const isValidMedicine = (medicine) => {
        if (!medicine) return false;
        
        if (typeof medicine === 'object' && medicine !== null) {
            return medicine._id && medicine.name && medicine.name !== 'Thuốc không xác định';
        } else if (typeof medicine === 'string') {
            return medicine && medicine !== 'Thuốc không xác định';
        }
        
        return false;
    };

    // Hàm lấy tên thuốc để hiển thị
    const getMedicineName = (medicine) => {
        if (!medicine) return 'Thuốc không xác định';
        
        if (typeof medicine === 'object' && medicine !== null) {
            return medicine.name || 'Thuốc không xác định';
        } else if (typeof medicine === 'string') {
            return medicine;
        }
        
        return 'Thuốc không xác định';
    };

    // Hàm lấy medicineId từ thuốc
    const getMedicineId = (medicine) => {
        if (!medicine) return null;
        
        if (typeof medicine === 'object' && medicine !== null) {
            return medicine._id || medicine.id || null;
        } else if (typeof medicine === 'string') {
            return medicine;
        }
        
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate patient selection
        if (!patientSelection) {
            setError("Vui lòng chọn loại bệnh nhân.");
            return;
        }
        
        // Validate CCCD only if "Chọn bệnh nhân" is selected
        if (patientSelection === "select_patient" && !cccd) {
            setError("Vui lòng chọn CCCD bệnh nhân.");
            return;
        }

        // Validate record selection if CCCD is selected
        if (patientSelection === "select_patient" && cccd && !selectedRecord) {
            setError("Vui lòng chọn record bệnh án.");
            return;
        }

        // Validate transaction items only when not a patient or no prescription
        if (!patientSelection || patientSelection === "not_a_patient" || !selectedRecord || prescription.length === 0) {
            if (transactionItems.some(item => !item.medicineId || !item.quantity || item.quantity <= 0)) {
                setError("Vui lòng điền đầy đủ thông tin các mục thuốc.");
                return;
            }
        }

        // Chuẩn bị items dựa trên loại giao dịch
        let itemsToSubmit = [];
        
        if (patientSelection === "select_patient" && selectedRecord && prescription.length > 0) {
            // Lọc và chỉ lấy những thuốc hợp lệ từ prescription
            itemsToSubmit = prescription
                .filter(item => isValidMedicine(item.medicine))
                .map(item => {
                    const medicineId = getMedicineId(item.medicine);
                    return {
                        medicineId: medicineId,
                        quantity: item.quantity
                    };
                });
            
            console.log("Original prescription:", prescription);
            console.log("Filtered valid items:", itemsToSubmit);
            
            // Kiểm tra xem có thuốc hợp lệ nào không
            if (itemsToSubmit.length === 0) {
                setError("Không có thuốc hợp lệ nào trong đơn thuốc để thanh toán.");
                return;
            }
        } else {
            // Sử dụng transactionItems cho các trường hợp khác
            itemsToSubmit = transactionItems;
            console.log("Items to submit from transactionItems:", itemsToSubmit);
        }

        try {
            const submitData = { 
                patientId: patientSelection === "not_a_patient" ? "not_a_patient" : cccd, 
                recordId: selectedRecord,
                paymentMethod, 
                items: itemsToSubmit
            };
            console.log("Submitting data:", submitData);
            await onSubmit(submitData);
            setTransactionItems([{ medicineId: "", quantity: "" }]);
            setPatientSelection("");
            setCccd("");
            setSelectedRecord("");
            setPaymentMethod("tien mat");
            setError(null);
            onHide();
        } catch (error) {
            setError("Không thể xử lý giao dịch. Vui lòng thử lại.");
        }
    };

    // Lấy danh sách records của CCCD đã chọn
    const selectedPatient = patients.find(p => p.cccd === cccd);
    const records = selectedPatient ? selectedPatient.records : [];
    
    // Lấy thông tin prescription của record đã chọn
    const selectedRecordInfo = records.find(r => r.recordId === selectedRecord);
    const prescription = selectedRecordInfo ? selectedRecordInfo.prescription : [];

    // Lọc prescription để chỉ hiển thị những thuốc hợp lệ
    const validPrescription = prescription.filter(item => isValidMedicine(item.medicine));
    const invalidPrescription = prescription.filter(item => !isValidMedicine(item.medicine));

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Tạo giao dịch mua thuốc</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="mb-3">
                        <Form.Label>Bệnh nhân</Form.Label>
                        <Form.Select
                            value={patientSelection}
                            onChange={(e) => {
                                setPatientSelection(e.target.value);
                                setCccd(""); // Reset cccd when selection changes
                                setSelectedRecord(""); // Reset selected record
                            }}
                        >
                            <option value="">Hãy lựa chọn</option>
                            <option value="select_patient">Chọn bệnh nhân</option> {/* eslint-disable-line */}
                            <option value="not_a_patient">Không phải bệnh nhân</option>
                        </Form.Select>
                    </div>
                    {patientSelection === "select_patient" && (
                        <div className="mb-3">
                            <Form.Label>CCCD bệnh nhân</Form.Label>
                            <Form.Select
                                value={cccd}
                                onChange={(e) => {
                                    setCccd(e.target.value);
                                    setSelectedRecord(""); // Reset selected record when CCCD changes
                                }}
                                required
                            >
                                <option value="">Chọn CCCD bệnh nhân</option>
                                {patients.map((patient) => (
                                    <option key={patient._id} value={patient.cccd}>
                                        {patient.cccd} - {patient.name} ({patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Khác'})
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    )}
                    {patientSelection === "select_patient" && cccd && records.length > 0 && (
                        <div className="mb-3">
                            <Form.Label>Chọn bệnh án</Form.Label>
                            <Form.Select
                                value={selectedRecord}
                                onChange={(e) => setSelectedRecord(e.target.value)}
                                required
                            >
                                <option value="">Chọn bệnh án</option>
                                {records.map((record) => (
                                    <option key={record.recordId} value={record.recordId}>
                                        {record.admissionDate ? new Date(record.admissionDate).toLocaleDateString('vi-VN') : 'N/A'} - 
                                        {record.admissionReason || 'Không có lý do nhập viện'}
                                        {record.dischargeDate ? ` (Xuất viện: ${new Date(record.dischargeDate).toLocaleDateString('vi-VN')})` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    )}
                    {patientSelection === "select_patient" && cccd && selectedRecord && prescription.length > 0 && (
                        <div className="mb-3">
                            <Form.Label>Đơn thuốc hiện tại</Form.Label>
                            <div className="border rounded p-3 bg-light">
                                <h6>Danh sách thuốc đã kê:</h6>
                                
                                {/* Hiển thị thuốc hợp lệ */}
                                {validPrescription.length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="text-success">Thuốc có thể thanh toán:</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered">
                                                <thead className="table-success">
                                                    <tr>
                                                        <th>STT</th>
                                                        <th>Tên thuốc</th>
                                                        <th>Số lượng</th>
                                                        <th>Ghi chú</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {validPrescription.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{getMedicineName(item.medicine)}</td>
                                                            <td className="text-center">{item.quantity}</td>
                                                            <td>{item.note || 'Không có ghi chú'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị thuốc không hợp lệ */}
                                {invalidPrescription.length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="text-warning">Thuốc không thể thanh toán:</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered">
                                                <thead className="table-warning">
                                                    <tr>
                                                        <th>STT</th>
                                                        <th>Tên thuốc</th>
                                                        <th>Số lượng</th>
                                                        <th>Ghi chú</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invalidPrescription.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td className="text-muted">{getMedicineName(item.medicine)}</td>
                                                            <td className="text-center text-muted">{item.quantity}</td>
                                                            <td className="text-muted">{item.note || 'Không có ghi chú'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2">
                                    <small className="text-muted">
                                        Tổng số thuốc: {prescription.length} loại
                                        {validPrescription.length > 0 && (
                                            <span className="text-success"> • Có thể thanh toán: {validPrescription.length} loại</span>
                                        )}
                                        {invalidPrescription.length > 0 && (
                                            <span className="text-warning"> • Không thể thanh toán: {invalidPrescription.length} loại</span>
                                        )}
                                    </small>
                                </div>
                            </div>
                        </div>
                    )}
                    {patientSelection === "select_patient" && cccd && selectedRecord && (!prescription || prescription.length === 0) && (
                        <div className="mb-3">
                            <Form.Label>Đơn thuốc hiện tại</Form.Label>
                            <div className="border rounded p-3 bg-light">
                                <p className="text-muted mb-0">Chưa có đơn thuốc nào cho bệnh án này.</p>
                            </div>
                        </div>
                    )}
                    <div className="mb-3">
                        <Form.Label>Phương thức thanh toán</Form.Label>
                        <Form.Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="tien mat">Tiền mặt</option>
                            <option value="online">Trực tuyến</option>
                        </Form.Select>
                    </div>
                    {/* Chỉ hiển thị danh sách thuốc khi không phải bệnh nhân hoặc chưa có đơn thuốc */}
                    {(!patientSelection || patientSelection === "not_a_patient" || !selectedRecord || prescription.length === 0) && (
                        <>
                            <h6>Danh sách thuốc</h6>
                            {transactionItems.map((item, index) => (
                                <div key={index} className="row mb-2">
                                    <div className="col-5">
                                        <Form.Select
                                            value={item.medicineId}
                                            onChange={(e) =>
                                                handleTransactionItemChange(index, "medicineId", e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">Chọn thuốc</option>
                                            {medicines.map((medicine) => (
                                                <option key={medicine._id} value={medicine._id}>
                                                    {medicine.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                    <div className="col-4">
                                        <Form.Control
                                            type="number"
                                            placeholder="Số lượng"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleTransactionItemChange(index, "quantity", e.target.value)
                                            }
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="col-3">
                                        <Button
                                            variant="danger"
                                            onClick={() => handleRemoveTransactionItem(index)}
                                            disabled={transactionItems.length === 1}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="secondary"
                                className="mt-2"
                                onClick={handleAddTransactionItem}
                            >
                                Thêm thuốc
                            </Button>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Đóng
                    </Button>
                    <Button variant="primary" type="submit">
                        Xác nhận giao dịch
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PharmacyTransactionModal; 