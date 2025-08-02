/* eslint-disable */
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const PharmacyTransactionModal = ({ show, onHide, medicines, patients = [], onSubmit }) => {
    const [transactionItems, setTransactionItems] = useState([{ medicineId: "", quantity: "" }]);
    const [patientSelection, setPatientSelection] = useState(""); // Tracks "Chọn bệnh nhân" or "Không phải bệnh nhân"
    const [patientId, setPatientId] = useState("");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate transaction items for all cases
        if (transactionItems.some(item => !item.medicineId || !item.quantity || item.quantity <= 0)) {
            setError("Vui lòng điền đầy đủ thông tin các mục thuốc.");
            return;
        }
        
        // Validate patient selection
        if (!patientSelection) {
            setError("Vui lòng chọn loại bệnh nhân.");
            return;
        }
        
        // Validate patient ID only if "Chọn bệnh nhân" is selected
        if (patientSelection === "select_patient" && !patientId) {
            setError("Vui lòng chọn mã bệnh nhân.");
            return;
        }
        try {
            await onSubmit({ 
                patientId: patientSelection === "not_a_patient" ? "not_a_patient" : patientId, 
                paymentMethod, 
                items: transactionItems 
            });
            setTransactionItems([{ medicineId: "", quantity: "" }]);
            setPatientSelection("");
            setPatientId("");
            setPaymentMethod("tien mat");
            setError(null);
            onHide();
        } catch (error) {
            setError("Không thể xử lý giao dịch. Vui lòng thử lại.");
        }
    };

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
                                setPatientId(""); // Reset patientId when selection changes
                            }}
                        >
                            <option value="">Hãy lựa chọn</option>
                            <option value="select_patient">Chọn bệnh nhân</option> {/* eslint-disable-line */}
                            <option value="not_a_patient">Không phải bệnh nhân</option>
                        </Form.Select>
                    </div>
                    {patientSelection === "select_patient" && (
                        <div className="mb-3">
                            <Form.Label>Mã bệnh nhân</Form.Label>
                            <Form.Select
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required
                            >
                                <option value="">Chọn mã bệnh nhân</option>
                                {patients.map((patient) => (
                                    <option key={patient._id} value={patient.patientId}>
                                        {patient.patientId} - {patient.name} ({patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Khác'})
                                    </option>
                                ))}
                            </Form.Select>
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