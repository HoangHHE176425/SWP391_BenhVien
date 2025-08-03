import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AccountantProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/accountant/profile');
            setProfile(response.data);
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                address: response.data.address || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Không thể tải thông tin hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/accountant/profile', formData);
            toast.success('Cập nhật hồ sơ thành công');
            setEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Không thể cập nhật hồ sơ');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <Container>
                <div className="text-center">Đang tải...</div>
            </Container>
        );
    }

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h4>Hồ Sơ Cá Nhân</h4>
                        </Card.Header>
                        <Card.Body>
                            {editing ? (
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Họ và tên</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Số điện thoại</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Địa chỉ</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <div className="d-flex gap-2">
                                        <Button variant="primary" type="submit">
                                            Lưu thay đổi
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => setEditing(false)}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </Form>
                            ) : (
                                <div>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Họ và tên:</strong> {profile?.name}</p>
                                            <p><strong>Email:</strong> {profile?.email}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Số điện thoại:</strong> {profile?.phone || 'Chưa cập nhật'}</p>
                                            <p><strong>Địa chỉ:</strong> {profile?.address || 'Chưa cập nhật'}</p>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <p><strong>Vai trò:</strong> Kế toán</p>
                                            <p><strong>Ngày tham gia:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                        </Col>
                                    </Row>
                                    <Button 
                                        variant="primary" 
                                        onClick={() => setEditing(true)}
                                    >
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AccountantProfile; 