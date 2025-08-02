import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AccountantAttendance = () => {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchTodayAttendance();
        fetchAttendanceHistory();
        
        // Cập nhật thời gian mỗi giây
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const fetchTodayAttendance = async () => {
        try {
            const response = await axios.get('/api/attendance/accountant/today');
            setAttendance(response.data);
        } catch (error) {
            console.error('Error fetching today attendance:', error);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            const response = await axios.get('/api/attendance/accountant/history');
            setAttendanceHistory(response.data);
        } catch (error) {
            console.error('Error fetching attendance history:', error);
        }
    };

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            await axios.post('/api/attendance/accountant/checkin');
            toast.success('Chấm công vào thành công!');
            fetchTodayAttendance();
        } catch (error) {
            console.error('Error checking in:', error);
            toast.error('Không thể chấm công vào');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            await axios.post('/api/attendance/accountant/checkout');
            toast.success('Chấm công ra thành công!');
            fetchTodayAttendance();
        } catch (error) {
            console.error('Error checking out:', error);
            toast.error('Không thể chấm công ra');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Chưa chấm công';
        return new Date(dateString).toLocaleTimeString('vi-VN');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const variants = {
            'present': 'success',
            'absent': 'danger',
            'late': 'warning',
            'half-day': 'info'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <Container>
            <Row className="mb-4">
                <Col>
                    <h2>Chấm Công</h2>
                </Col>
            </Row>

            {/* Current Time Display */}
            <Row className="mb-4">
                <Col>
                    <Card className="text-center">
                        <Card.Body>
                            <h3>Thời gian hiện tại</h3>
                            <h2 className="text-primary">
                                {currentTime.toLocaleTimeString('vi-VN')}
                            </h2>
                            <p className="text-muted">
                                {currentTime.toLocaleDateString('vi-VN', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Today's Attendance */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Chấm công hôm nay</h5>
                        </Card.Header>
                        <Card.Body>
                            {attendance ? (
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Giờ vào:</strong> {formatTime(attendance.checkInTime)}</p>
                                        <p><strong>Giờ ra:</strong> {formatTime(attendance.checkOutTime)}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Trạng thái:</strong> {getStatusBadge(attendance.status)}</p>
                                        <p><strong>Tổng giờ làm:</strong> {attendance.totalHours || 'Chưa tính'} giờ</p>
                                    </Col>
                                </Row>
                            ) : (
                                <p>Chưa có dữ liệu chấm công hôm nay</p>
                            )}

                            <div className="d-flex gap-2 mt-3">
                                <Button 
                                    variant="success" 
                                    onClick={handleCheckIn}
                                    disabled={loading || (attendance && attendance.checkInTime)}
                                >
                                    Chấm công vào
                                </Button>
                                <Button 
                                    variant="warning" 
                                    onClick={handleCheckOut}
                                    disabled={loading || !attendance || !attendance.checkInTime || attendance.checkOutTime}
                                >
                                    Chấm công ra
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Attendance History */}
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <h5>Lịch sử chấm công</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Ngày</th>
                                        <th>Giờ vào</th>
                                        <th>Giờ ra</th>
                                        <th>Tổng giờ</th>
                                        <th>Trạng thái</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceHistory.map((record) => (
                                        <tr key={record._id}>
                                            <td>{formatDate(record.date)}</td>
                                            <td>{formatTime(record.checkInTime)}</td>
                                            <td>{formatTime(record.checkOutTime)}</td>
                                            <td>{record.totalHours || '-'} giờ</td>
                                            <td>{getStatusBadge(record.status)}</td>
                                            <td>{record.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {attendanceHistory.length === 0 && (
                                <div className="text-center text-muted">
                                    Chưa có lịch sử chấm công
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AccountantAttendance;
