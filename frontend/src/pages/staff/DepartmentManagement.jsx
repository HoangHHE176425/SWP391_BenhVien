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
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { message } from "antd";
import "../../assets/css/Homepage.css";

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
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "Staff") {
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

  const handleAddNew = () => {
    setCurrentDepartment(null);
    setForm({ name: "", description: "" });
    setImageFile(null);
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setCurrentDepartment(department);
    setForm({
      name: department.name || "",
      description: department.description || "",
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
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
    <Container fluid className="py-5 bg-light">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý khoa</h4>
          <Button variant="success" onClick={handleAddNew} className="rounded-pill px-4">
            <FaPlus className="me-2" /> Thêm khoa
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <InputGroup className="rounded-pill overflow-hidden shadow-sm">
                <InputGroup.Text className="bg-white border-0"><FaSearch /></InputGroup.Text>
                <FormControl
                  placeholder="Tìm theo tên hoặc mô tả..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="border-0"
                />
                {searchQuery && (
                  <InputGroup.Text className="bg-white border-0" onClick={handleClearFilters} style={{ cursor: 'pointer' }}>
                    <FaTimes />
                  </InputGroup.Text>
                )}
              </InputGroup>
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
                      <th>Tên</th>
                      <th>Mô tả</th>
                      <th>Hình ảnh</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department, index) => (
                      <tr key={department._id}>
                        <td>{(currentPage - 1) * paginationLimit + index + 1}</td>
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
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(department)}>
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(department._id)}>
                            <FaTrash />
                          </Button>
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
      </Card>

      {/* Modal Thêm / Sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton className="bg-primary text-white">
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
              />
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
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ảnh đại diện</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="rounded-pill" />
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
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4">
            {currentDepartment ? "Lưu" : "Thêm"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <Modal show={showDeleteModal} onHide={cancelDelete} centered size="sm">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xóa phòng ban này?</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={cancelDelete} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="rounded-pill px-4">
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DepartmentManagement;