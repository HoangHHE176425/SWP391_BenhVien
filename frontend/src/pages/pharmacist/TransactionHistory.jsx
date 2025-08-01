import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Pagination } from 'react-bootstrap';
import axios from 'axios';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [patientIdFilter, setPatientIdFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/pharmacist/transactions', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: 10,
                    patientId: patientIdFilter,
                    sortBy: 'createdAt',
                    sortOrder,
                },
            });
            setTransactions(response.data.transactions);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, patientIdFilter, sortOrder]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSortToggle = () => {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    // Thêm báo cáo định kỳ (hiển thị thông báo nếu tồn kho thấp)
    const checkInventoryReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/pharmacist/medicinesall', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, limit: 1, filterMode: 'low-stock' },
            });
            if (response.data.totalMedicines > 0) {
                alert('Báo cáo định kỳ: Có thuốc sắp hết hàng!');
            }
        } catch (err) {
            console.error('Error checking inventory:', err);
        }
    };

    useEffect(() => {
        checkInventoryReport();
    }, []);

    return (
        <div className="container mt-4">
            <h2>Lịch sử giao dịch</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="Lọc theo mã bệnh nhân"
                    value={patientIdFilter}
                    onChange={(e) => setPatientIdFilter(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchTransactions()}
                />
            </div>
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Mã bệnh nhân</th>
                                <th>Thuốc</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                                <th>
                                    <Button variant="link" onClick={handleSortToggle}>
                                        Ngày tạo {sortOrder === 'desc' ? '↓' : '↑'}
                                    </Button>
                                </th>
                                <th>Phương thức thanh toán</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td>{transaction.patient}</td>
                                    <td>
                                        {transaction.items.map((item) => (
                                            <div key={item.medicine._id}>
                                                {item.medicine.name} (Giá: {item.medicine.unitPrice})
                                            </div>
                                        ))}
                                    </td>
                                    <td>
                                        {transaction.items.map((item) => (
                                            <div key={item.medicine._id}>{item.quantity}</div>
                                        ))}
                                    </td>
                                    <td>{transaction.totalAmount.toLocaleString()} VND</td>
                                    <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                    <td>{transaction.paymentMethod}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Pagination.Item
                                key={page}
                                active={page === currentPage}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </Pagination.Item>
                        ))}
                    </Pagination>
                </>
            )}
        </div>
    );
};

export default TransactionHistory;