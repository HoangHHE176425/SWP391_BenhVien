import React, { useEffect, useState } from "react";
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
import axios from "axios";
import "../../assets/css/UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    fetchUsers(searchQuery, statusFilter, currentPage);
  }, [searchQuery, statusFilter, currentPage]);

  const fetchUsers = async (search = "", status = "all", page = 1) => {
    setLoading(true);
    try {
      const params = { search, page, limit };
      if (status !== "all") params.status = status;

      const res = await axios.get("http://localhost:9999/api/users", {
        params,
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setTotalItems(res.data.totalUsers || 0);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Không tải được người dùng.");
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setCurrentUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "active",
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      status: user.status || "active",
    });
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
      if (currentUser) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`http://localhost:9999/api/users/${currentUser._id}`, payload);
      } else {
        await axios.post("http://localhost:9999/api/users", form);
      }
      setShowModal(false);
      fetchUsers(searchQuery, statusFilter, currentPage);
    } catch (error) {
      alert("Hoạt động không thành công: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:9999/api/users/${deleteUserId}`);
      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers(searchQuery, statusFilter, currentPage);
    } catch (error) {
      alert("Delete failed: " + (error.response?.data?.message || error.message));
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteUserId(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid className="py-5 bg-light">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý người dùng</h4>
          <Button variant="success" onClick={handleAddNew} className="rounded-pill px-4">
            <FaPlus className="me-2" /> Thêm mới
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <InputGroup className="rounded-pill overflow-hidden shadow-sm">
                <InputGroup.Text className="bg-white border-0"><FaSearch /></InputGroup.Text>
                <FormControl
                  placeholder="Tìm theo tên, email hoặc mã..."
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
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusChange}
                className="rounded-pill shadow-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-primary"
                onClick={handleClearFilters}
                className="rounded-pill w-100"
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">
              <h5>{error}</h5>
              <Button variant="primary" onClick={() => fetchUsers(searchQuery, statusFilter, currentPage)}>
                Thử lại
              </Button>
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted text-center">Không tìm thấy người dùng nào.</p>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover className="table-align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>STT</th>
                      <th>Mã</th>
                      <th>Email</th>
                      <th>Tên</th>
                      <th>SĐT</th>
                      <th>Trạng thái</th>
                      <th>Hồ sơ</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user._id}>
                        <td>{(currentPage - 1) * limit + index + 1}</td>
                        <td className="user-code">{user.user_code || "N/A"}</td>
                        <td className="text-muted">{user.email}</td>
                        <td>{user.name}</td>
                        <td>{user.phone || "N/A"}</td>
                        <td>
                          <Badge bg={user.status === "active" ? "success" : "secondary"}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          {user.profiles && user.profiles.length > 0 ? (
                            user.profiles.map((pId) => <Badge key={pId} bg="secondary" className="me-1 mb-1">{pId}</Badge>)
                          ) : (
                            <Badge bg="warning">Không có</Badge>
                          )}
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(user)}>
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(user._id)}>
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
                  Hiển thị từ {(currentPage - 1) * limit + 1} đến{" "}
                  {Math.min(currentPage * limit, totalItems)} / {totalItems}
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((page) => (
                    <Pagination.Item
                      key={page + 1}
                      active={page + 1 === currentPage}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{currentUser ? "Chỉnh sửa người dùng" : "Thêm mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {currentUser && (
              <Form.Group className="mb-3">
                <Form.Label>Mã</Form.Label>
                <Form.Control
                  value={currentUser.user_code || "N/A"}
                  readOnly
                  className="rounded-pill"
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                className="rounded-pill"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-pill"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="rounded-pill"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                name="password"
                type="password"
                placeholder={currentUser ? "Để trống để giữ mật khẩu cũ" : ""}
                value={form.password}
                onChange={handleChange}
                className="rounded-pill"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="rounded-pill"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4">
            {currentUser ? "Lưu" : "Thêm"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={cancelDelete} centered size="sm">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn xóa người dùng này?</Modal.Body>
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

export default UserManagement;

