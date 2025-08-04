import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Container,
  Spinner,
  Modal,
  Form,
  Row,
  Col,
  InputGroup,
  FormControl,
  Pagination,
  Card,
  Badge,
} from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { message } from "antd";
import styled from "styled-components";

const StyledContainer = styled(Container)`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const StyledButton = styled(Button)`
  border-radius: 8px;
  transition: background-color 0.3s;
`;

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .modal-header {
    background: #1890ff;
    color: white;
    border-radius: 12px 12px 0 0;
  }
  .modal-footer {
    border-top: none;
    padding-top: 0;
  }
`;

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [paginationLimit, setPaginationLimit] = useState(5);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState({ name: "", description: "" });
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "Admin") {
      message.warning("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchDepartments();
  }, [searchQuery, currentPage, paginationLimit]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:9999/api/departments", {
        params: {
          search: searchQuery.trim(),
          page: currentPage,
          limit: paginationLimit,
          isAll:true,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { departments, pagination } = response.data;
      setDepartments(departments || []);
      setCurrentPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (error) {
      console.error("Lỗi tải danh sách khoa:", error);
      message.error("Không thể tải danh sách khoa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors = { name: "", description: "" };
    let isValid = true;

    if (!form.name.trim()) {
      errors.name = "Vui lòng nhập tên phòng ban.";
      isValid = false;
    }

    if (!form.description.trim()) {
      errors.description = "Vui lòng nhập mô tả.";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleAddNew = () => {
    setCurrentDepartment(null);
    setForm({ name: "", description: "" });
    setFormErrors({ name: "", description: "" });
    setImageFile(null);
    setShowModal(true);
  };

  const handleViewLogs = async (departmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:9999/api/departments/${departmentId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data.logs || []);
      setShowLogModal(true);
    } catch (err) {
      message.error("Không thể tải log.");
    }
  };

  const handleEdit = (department) => {
    setCurrentDepartment(department);
    setForm({
      name: department.name || "",
      description: department.description || "",
    });
    setFormErrors({ name: "", description: "" });
    setImageFile(null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: value.trim() ? "" : `Vui lòng nhập ${name === "name" ? "tên phòng ban" : "mô tả"}.`,
    }));
  };

  const toggleStatus = async (department) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = department.status === "active" ? "inactive" : "active";
      await axios.put(
        `http://localhost:9999/api/departments/${department._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success(
        `Đã chuyển trạng thái khoa sang ${newStatus === "active" ? "hoạt động" : "không hoạt động"}`
      );
      fetchDepartments();
    } catch (error) {
      console.error("Lỗi chuyển trạng thái:", error);
      message.error("Không thể chuyển trạng thái.");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      message.error("Vui lòng kiểm tra và điền đầy đủ các trường bắt buộc.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      };

      if (currentDepartment) {
        await axios.put(
          `http://localhost:9999/api/departments/${currentDepartment._id}`,
          formData,
          config
        );
        message.success("Cập nhật phòng ban thành công!");
      } else {
        await axios.post("http://localhost:9999/api/departments", formData, config);
        message.success("Thêm phòng ban thành công!");
      }

      setShowModal(false);
      setImageFile(null);
      fetchDepartments();
    } catch (error) {
      console.error("Lỗi gửi yêu cầu:", error);
      message.error(error.response?.data?.message || "Thao tác thất bại.");
    }
  };

  const handleDeleteClick = (departmentId) => {
    setDeleteDepartmentId(departmentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:9999/api/departments/${deleteDepartmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success("Xóa phòng ban thành công!");
      setShowDeleteModal(false);
      fetchDepartments();
    } catch (error) {
      message.error(error.response?.data?.message || "Xóa thất bại.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <StyledContainer fluid>
      <StyledCard>
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý khoa</h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4 align-items-center">
          <Col xs={12} md={6} className="d-flex align-items-center gap-2">
            <InputGroup className="rounded-pill overflow-hidden shadow-sm" style={{ maxWidth: "250px" }}>
              <InputGroup.Text className="bg-white border-0">
                <FaSearch />
              </InputGroup.Text>
              <FormControl
                placeholder="Tìm tên, mã khoa..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border-0"
              />
              {searchQuery && (
                <InputGroup.Text
                  className="bg-white border-0"
                  onClick={handleClearFilters}
                  style={{ cursor: "pointer" }}
                >
                  <FaTimes />
                </InputGroup.Text>
              )}
            </InputGroup>
            <Button
              variant="success"
              onClick={handleAddNew}
              className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill shadow-sm"
            >
              <FaPlus /> <span className="d-none d-md-inline">Thêm khoa</span>
            </Button>
          </Col>
        </Row>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : departments.length === 0 ? (
            <p className="text-muted text-center">Không tìm thấy phòng ban nào.</p>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover className="table-align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>STT</th>
                      <th>Mã khoa</th>
                      <th>Tên</th>
                      <th>Mô tả</th>
                      <th>Hình ảnh</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department, index) => (
                      <tr key={department._id}>
                        <td>{(currentPage - 1) * paginationLimit + index + 1}</td>
                        <td>{department.departmentCode || "N/A"}</td>
                        <td>{department.name}</td>
                        <td className="text-muted">{department.description || "Không có"}</td>
                        <td>
                          {department.image ? (
                            <img
                              src={department.image}
                              alt="Ảnh phòng ban"
                              className="rounded-circle shadow-sm"
                              style={{ width: "50px", height: "50px", objectFit: "cover" }}
                            />
                          ) : (
                            <Badge bg="secondary">Không có</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={department.status === "active" ? "success" : "secondary"}>
                            {department.status === "active" ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td>
                          <StyledButton
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(department)}
                          >
                            <FaEdit />
                          </StyledButton>
                          <StyledButton
                            variant="light"
                            size="sm"
                            className="me-2"
                            onClick={() => toggleStatus(department)}
                            title={
                              department.status === "active"
                                ? "Chuyển sang không hoạt động"
                                : "Kích hoạt khoa"
                            }
                            style={{
                              color: department.status === "active" ? "green" : "gray",
                              borderColor: department.status === "active" ? "green" : "gray",
                            }}
                          >
                            {department.status === "active" ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                          </StyledButton>
                          <StyledButton
                            variant="outline-dark"
                            size="sm"
                            className="me-2"
                            onClick={() => handleViewLogs(department._id)}
                          >
                            Xem Log
                          </StyledButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-4">
                <small className="text-muted">
                  Hiển thị từ {(currentPage - 1) * paginationLimit + 1} đến{" "}
                  {Math.min(currentPage * paginationLimit, totalItems)} / {totalItems}
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((_, idx) => (
                    <Pagination.Item
                      key={idx + 1}
                      active={currentPage === idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </StyledCard>

      {/* Modal Thêm / Sửa */}
      <StyledModal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>{currentDepartment ? "Cập nhật phòng ban" : "Thêm phòng ban"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên phòng ban</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nhập tên phòng ban"
                className="rounded-pill"
                isInvalid={!!formErrors.name}
              />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nhập mô tả"
                className="rounded-3"
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ảnh đại diện</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="rounded-pill"
              />
              {currentDepartment?.image && (
                <div className="mt-2">
                  <img
                    src={currentDepartment.image}
                    alt="Current"
                    className="rounded-circle shadow-sm"
                    style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <StyledButton variant="outline-secondary" onClick={() => setShowModal(false)} className="px-4">
            Hủy
          </StyledButton>
          <StyledButton
            variant="primary"
            onClick={handleSubmit}
            className="px-4"
            disabled={!!formErrors.name || !!formErrors.description}
          >
            {currentDepartment ? "Lưu" : "Thêm"}
          </StyledButton>
        </Modal.Footer>
      </StyledModal>

      {/* Modal Xác nhận Xóa */}
      <StyledModal show={showDeleteModal} onHide={cancelDelete} centered size="sm">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xóa phòng ban này?</Modal.Body>
        <Modal.Footer>
          <StyledButton variant="outline-secondary" onClick={cancelDelete} className="px-4">
            Hủy
          </StyledButton>
          <StyledButton variant="danger" onClick={confirmDelete} className="px-4">
            Xóa
          </StyledButton>
        </Modal.Footer>
      </StyledModal>

      {/* Modal Xem Log */}
      <StyledModal show={showLogModal} onHide={() => setShowLogModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: 500, overflowY: "auto" }}>
          {logs.length === 0 ? (
            <p className="text-muted">Chưa có log nào cho phòng ban này.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {logs.map((log, index) => (
                <div
                  key={log._id || index}
                  className="border rounded p-3 shadow-sm"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <div className="mb-1 d-flex align-items-center justify-content-between">
                    <strong>
                      <span className="me-2">Thao tác:</span>
                      <span className="badge bg-primary text-uppercase">{log.action}</span>
                    </strong>
                    <small className="text-muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {log.description && (
                    <div className="mb-2">
                      <strong>Mô tả:</strong> {log.description}
                    </div>
                  )}
                  <div>
                    <strong>Người thực hiện:</strong>{" "}
                    {log.performedBy ? (
                      <>
                        {log.performedBy.name}{" "}
                        {log.performedBy.employeeCode && (
                          <span className="text-muted">({log.performedBy.employeeCode})</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">Không xác định</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </StyledModal>
    </StyledContainer>
  );
};

export default DepartmentManagement;