import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AccountantStatistics = () => {
    const [stats, setStats] = useState({
        sales: {},
        inventory: {},
        attendance: {},
        financial: {}
    });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        period: 'month'
    });

    useEffect(() => {
        fetchStatistics();
    }, [filters]);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accountant/statistics', {
                params: filters
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            toast.error('Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('vi-VN').format(number || 0);
    };

    const formatPercentage = (value, total) => {
        if (!total || total === 0) return '0%';
        return `${((value / total) * 100).toFixed(1)}%`;
    };

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2>Thống Kê</h2>
                </Col>
            </Row>

            {/* Filters */}
            <Row className="mb-4">
                <Col>
                    <Card>
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
                                        <Form.Label>Khoảng thời gian</Form.Label>
                                        <Form.Select
                                            value={filters.period}
                                            onChange={(e) => setFilters({...filters, period: e.target.value})}
                                        >
                                            <option value="day">Ngày</option>
                                            <option value="week">Tuần</option>
                                            <option value="month">Tháng</option>
                                            <option value="quarter">Quý</option>
                                            <option value="year">Năm</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="d-flex align-items-end">
                                    <Button 
                                        variant="primary" 
                                        onClick={fetchStatistics}
                                    >
                                        Cập nhật thống kê
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Sales Statistics */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Thống kê bán hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <Row>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-primary">{formatCurrency(stats.sales.totalRevenue)}</h4>
                                            <p className="text-muted">Tổng doanh thu</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-success">{formatNumber(stats.sales.totalOrders)}</h4>
                                            <p className="text-muted">Tổng đơn hàng</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-info">{formatCurrency(stats.sales.averageOrderValue)}</h4>
                                            <p className="text-muted">Giá trị đơn hàng trung bình</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-warning">{formatNumber(stats.sales.totalItems)}</h4>
                                            <p className="text-muted">Tổng sản phẩm bán ra</p>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Inventory Statistics */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Thống kê tồn kho</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <Row>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-primary">{formatNumber(stats.inventory.totalProducts)}</h4>
                                            <p className="text-muted">Tổng sản phẩm</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-success">{formatNumber(stats.inventory.inStock)}</h4>
                                            <p className="text-muted">Còn hàng</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-warning">{formatNumber(stats.inventory.lowStock)}</h4>
                                            <p className="text-muted">Sắp hết hàng</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-danger">{formatNumber(stats.inventory.outOfStock)}</h4>
                                            <p className="text-muted">Hết hàng</p>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Financial Statistics */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Thống kê tài chính</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <Row>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-success">{formatCurrency(stats.financial.totalRevenue)}</h4>
                                            <p className="text-muted">Tổng doanh thu</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-danger">{formatCurrency(stats.financial.totalCost)}</h4>
                                            <p className="text-muted">Tổng chi phí</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-primary">{formatCurrency(stats.financial.grossProfit)}</h4>
                                            <p className="text-muted">Lợi nhuận gộp</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-info">{formatPercentage(stats.financial.profitMargin, stats.financial.totalRevenue)}</h4>
                                            <p className="text-muted">Tỷ suất lợi nhuận</p>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Attendance Statistics */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Thống kê chấm công</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <Row>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-success">{formatNumber(stats.attendance.present)}</h4>
                                            <p className="text-muted">Có mặt</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-danger">{formatNumber(stats.attendance.absent)}</h4>
                                            <p className="text-muted">Vắng mặt</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-warning">{formatNumber(stats.attendance.late)}</h4>
                                            <p className="text-muted">Đi muộn</p>
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-center">
                                            <h4 className="text-info">{formatPercentage(stats.attendance.attendanceRate, stats.attendance.total)}</h4>
                                            <p className="text-muted">Tỷ lệ chấm công</p>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Top Products */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card>
                        <Card.Header>
                            <h5>Sản phẩm bán chạy nhất</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <div>
                                    {stats.sales.topProducts?.map((product, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                            <span>{index + 1}. {product.name}</span>
                                            <span className="text-primary">{formatNumber(product.quantity)}</span>
                                        </div>
                                    ))}
                                    {(!stats.sales.topProducts || stats.sales.topProducts.length === 0) && (
                                        <div className="text-center text-muted">Không có dữ liệu</div>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header>
                            <h5>Doanh thu theo ngày</h5>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">Đang tải...</div>
                            ) : (
                                <div>
                                    {stats.sales.dailyRevenue?.map((day, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                            <span>{day.date}</span>
                                            <span className="text-success">{formatCurrency(day.revenue)}</span>
                                        </div>
                                    ))}
                                    {(!stats.sales.dailyRevenue || stats.sales.dailyRevenue.length === 0) && (
                                        <div className="text-center text-muted">Không có dữ liệu</div>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AccountantStatistics; 