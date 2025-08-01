import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const PharmacyTransactionModal = ({ show, onHide, medicines, onSubmit }) => {
    const [transactionItems, setTransactionItems] = useState([{ medicineId: "", quantity: "" }]);
    const [patientId, setPatientId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
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
        if (!patientId || transactionItems.some(item => !item.medicineId || !item.quantity || item.quantity <= 0)) {
            setError("Vui lòng điền đầy đủ thông tin bệnh nhân và các mục thuốc.");
            return;
        }
        try {
            await onSubmit({ patientId, paymentMethod, items: transactionItems });
            setTransactionItems([{ medicineId: "", quantity: "" }]);
            setPatientId("");
            setPaymentMethod("cash");
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
                        <Form.Label>Mã bệnh nhân</Form.Label>
                        <Form.Control
                            type="text"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <Form.Label>Phương thức thanh toán</Form.Label>
                        <Form.Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash">Tiền mặt</option>
                            <option value="insurance">Bảo hiểm</option>
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