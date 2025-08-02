import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AccountantReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        reportType: 'all'
    });

    useEffect(() => {
        fetchReports();
    }, [filters]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accountant/reports', {
                params: filters
            });
            setReports(response.data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Không thể tải báo cáo');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async (reportType) => {
        try {
            const response = await axios.post('/api/accountant/reports/generate', {
                reportType,
                ...filters
            });
            toast.success('Tạo báo cáo thành công');
            fetchReports();
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Không thể tạo báo cáo');
        }
    };

    const downloadReport = async (reportId) => {
        try {
            const response = await axios.get(`/api/accountant/reports/${reportId}/download`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Không thể tải xuống báo cáo');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getReportTypeBadge = (type) => {
        const variants = {
            'sales': 'success',
            'inventory': 'info',
            'financial': 'warning',
            'attendance': 'primary'
        };
        const labels = {
            'sales': 'Báo cáo bán hàng',
            'inventory': 'Báo cáo tồn kho',
            'financial': 'Báo cáo tài chính',
            'attendance': 'Báo cáo chấm công'
        };
        return <Badge bg={variants[type] || 'secondary'}>{labels[type] || type}</Badge>;
    };

    const getStatusBadge = (status) => {
        const variants = {
            'completed': 'success',
            'processing': 'warning',
            'failed': 'danger'
        };
        const labels = {
            'completed': 'Hoàn thành',
            'processing': 'Đang xử lý',
            'failed': 'Thất bại'
        };
        return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
    };

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Báo Cáo</h2>
                </Col>
            </Row>

            {/* Report Generation */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Tạo báo cáo mới</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Từ ngày</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Đến ngày</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Loại báo cáo</Form.Label>
                                        <Form.Select
                                            value={filters.reportType}
                                            onChange={(e) => setFilters({...filters, reportType: e.target.value})}
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="sales">Báo cáo bán hàng</option>
                                            <option value="inventory">Báo cáo tồn kho</option>
                                            <option value="financial">Báo cáo tài chính</option>
                                            <option value="attendance">Báo cáo chấm công</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="d-flex align-items-end">
                                    <Button 
                                        variant="primary" 
                                        onClick={() => generateReport(filters.reportType)}
                                        disabled={!filters.startDate || !filters.endDate}
                                    >
                                        Tạo báo cáo
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Report Buttons */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Báo cáo nhanh</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <Button 
                                        variant="outline-success" 
                                        className="w-100 mb-2"
                                        onClick={() => generateReport('sales')}
                                    >
                                        Báo cáo bán hàng tháng
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button 
                                        variant="outline-info" 
                                        className="w-100 mb-2"
                                        onClick={() => generateReport('inventory')}
                                    >
                                        Báo cáo tồn kho
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button 
                                        variant="outline-warning" 
                                        className="w-100 mb-2"
                                        onClick={() => generateReport('financial')}
                                    >
                                        Báo cáo tài chính
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button 
                                        variant="outline-primary" 
                                        className="w-100 mb-2"
                                        onClick={() => generateReport('attendance')}
                                    >
                                        Báo cáo chấm công
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Reports List */}
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Danh sách báo cáo</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Mã báo cáo</th>
                                            <th>Loại báo cáo</th>
                                            <th>Thời gian tạo</th>
                                            <th>Khoảng thời gian</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map((report) => (
                                            <tr key={report._id}>
                                                <td>{report.reportId}</td>
                                                <td>{getReportTypeBadge(report.type)}</td>
                                                <td>{formatDateTime(report.createdAt)}</td>
                                                <td>
                                                    {formatDate(report.startDate)} - {formatDate(report.endDate)}
                                                </td>
                                                <td>{getStatusBadge(report.status)}</td>
                                                <td>
                                                    {report.status === 'completed' && (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => downloadReport(report._id)}
                                                        >
                                                            Tải xuống
                                                        </Button>
                                                    )}
                                                    {report.status === 'processing' && (
                                                        <span className="text-muted">Đang xử lý...</span>
                                                    )}
                                                    {report.status === 'failed' && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => generateReport(report.type)}
                                                        >
                                                            Thử lại
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}

                            {reports.length === 0 && !loading && (
                                <div className="text-center text-muted">
                                    Chưa có báo cáo nào
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AccountantReports; 