import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const MedicineFormModal = ({ show, onHide, onSubmit, editMedicine, emptyMedicine }) => {
  const [form, setForm] = useState(emptyMedicine);

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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  // Bọc toàn bộ value={...} bằng form.xxx ?? ""
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editMedicine ? "Sửa thuốc" : "Thêm thuốc mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
              <Form.Group className="mb-2">
                <Form.Label>Tên thuốc *</Form.Label>
                <Form.Control required name="name" value={form.name ?? ""} onChange={handleChange} />
              </Form.Group>
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
  );
};

export default MedicineFormModal;