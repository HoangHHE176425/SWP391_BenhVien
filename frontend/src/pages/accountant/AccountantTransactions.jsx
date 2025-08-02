import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AccountantTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        searchTerm: ''
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/pharmacist/transactions', {
                params: {
                    page: currentPage,
                    limit: 10,
                    ...filters
                }
            });
            
            setTransactions(response.data.transactions || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Không thể tải lịch sử giao dịch');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const variants = {
            'completed': 'success',
            'pending': 'warning',
            'cancelled': 'danger',
            'processing': 'info'
        };
        const labels = {
            'completed': 'Hoàn thành',
            'pending': 'Chờ xử lý',
            'cancelled': 'Đã hủy',
            'processing': 'Đang xử lý'
        };
        return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1); // Reset về trang đầu khi filter
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            status: '',
            searchTerm: ''
        });
        setCurrentPage(1);
    };

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Lịch Sử Giao Dịch</h2>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="pending">Chờ xử lý</option>
                                    <option value="cancelled">Đã hủy</option>
                                    <option value="processing">Đang xử lý</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Tìm kiếm</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Mã giao dịch, tên bệnh nhân..."
                                    value={filters.searchTerm}
                                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button 
                                variant="outline-secondary" 
                                onClick={clearFilters}
                                className="me-2"
                            >
                                Xóa bộ lọc
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={fetchTransactions}
                            >
                                Tìm kiếm
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">Đang tải...</div>
                    ) : (
                        <>
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Mã giao dịch</th>
                                        <th>Ngày giao dịch</th>
                                        <th>Bệnh nhân</th>
                                        <th>Số lượng thuốc</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr key={transaction._id}>
                                            <td>{transaction.transactionId}</td>
                                            <td>{formatDateTime(transaction.createdAt)}</td>
                                            <td>{transaction.patientName || transaction.patientId}</td>
                                            <td>{transaction.items?.length || 0} loại</td>
                                            <td>{formatCurrency(transaction.totalAmount)}</td>
                                            <td>{getStatusBadge(transaction.status)}</td>
                                            <td>
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleViewDetail(transaction)}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {transactions.length === 0 && (
                                <div className="text-center text-muted">
                                    Không tìm thấy giao dịch nào
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3">
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

            {/* Transaction Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết giao dịch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTransaction && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p><strong>Mã giao dịch:</strong> {selectedTransaction.transactionId}</p>
                                    <p><strong>Ngày giao dịch:</strong> {formatDateTime(selectedTransaction.createdAt)}</p>
                                    <p><strong>Bệnh nhân:</strong> {selectedTransaction.patientName || selectedTransaction.patientId}</p>
                                    <p><strong>Trạng thái:</strong> {getStatusBadge(selectedTransaction.status)}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Tổng tiền:</strong> {formatCurrency(selectedTransaction.totalAmount)}</p>
                                    <p><strong>Phương thức thanh toán:</strong> {selectedTransaction.paymentMethod || 'Chưa xác định'}</p>
                                    <p><strong>Ghi chú:</strong> {selectedTransaction.notes || 'Không có'}</p>
                                </Col>
                            </Row>

                            <h6>Chi tiết thuốc:</h6>
                            <Table responsive striped size="sm">
                                <thead>
                                    <tr>
                                        <th>Tên thuốc</th>
                                        <th>Số lượng</th>
                                        <th>Đơn giá</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTransaction.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.medicineName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AccountantTransactions; 