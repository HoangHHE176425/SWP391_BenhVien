import { Button, Checkbox, Input, message, Modal, Spin, Table, Tooltip, Typography } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
const { Title } = Typography;
const { Search } = Input;

const Prescription = ({ visible, onCancel, onConfirm }) => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedMedicines, setSelectedMedicines] = useState([]);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        if (visible) {
            fetchMedicines(searchText);
        }
    }, [searchText, visible]);

    const fetchMedicines = async (text) => {
        try {
            const res = await axios.get(`/api/medicines?text=${text}`);
            setMedicines(res.data);
        } catch (err) {
            message.error('Không thể tải danh sách thuốc');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleMedicineSelect = (medicine, checked) => {
        if (checked) {
            setSelectedMedicines(prev => [...prev, medicine]);
            setQuantities(prev => ({ ...prev, [medicine._id]: 1 }));
        } else {
            setSelectedMedicines(prev => prev.filter(m => m._id !== medicine._id));
            setQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[medicine._id];
                return newQuantities;
            });
        }
    };

    const handleQuantityChange = (medicineId, value) => {
        setQuantities(prev => ({ ...prev, [medicineId]: value }));
    };

    const handleConfirm = () => {
        const selectedData = selectedMedicines.map(medicine => ({
            medicine: medicine,
            quantity: quantities[medicine._id] || 1
        }));
        onConfirm(selectedData);
        handleCancel();
    };

    const handleCancel = () => {
        setSelectedMedicines([]);
        setQuantities({});
        setSearchText('');
        onCancel();
    };

    const columns = [
        {
            title: 'Chọn',
            key: 'select',
            width: 60,
            render: (_, record) => (
                <Checkbox
                    checked={selectedMedicines.some(m => m._id === record._id)}
                    onChange={(e) => handleMedicineSelect(record, e.target.checked)}
                />
            ),
        },
        {
            title: 'Tên thuốc',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left',
            width: 150,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            sorter: (a, b) => a.type.localeCompare(b.type),
        },
        {
            title: 'Nhóm',
            dataIndex: 'group',
            key: 'group',
            width: 100,
        },
        {
            title: 'Chỉ định',
            dataIndex: 'indication',
            key: 'indication',
            width: 200,
            sorter: (a, b) => a.indication.localeCompare(b.indication),
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>
                </Tooltip>
            ),
        },
        {
            title: 'Liều dùng',
            dataIndex: 'dosage',
            key: 'dosage',
            width: 150,
            sorter: (a, b) => a.dosage.localeCompare(b.dosage),
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>
                </Tooltip>
            ),
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 80,
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Hạn sử dụng',
            dataIndex: 'expirationDate',
            key: 'expirationDate',
            width: 120,
            sorter: (a, b) => new Date(a.expirationDate) - new Date(b.expirationDate),
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
    ];

    return (
        <Modal
            title="Chọn thuốc kê đơn"
            open={visible}
            onCancel={handleCancel}
            width={1200}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button 
                    key="confirm" 
                    type="primary" 
                    onClick={handleConfirm}
                    disabled={selectedMedicines.length === 0}
                >
                    Xác nhận ({selectedMedicines.length} thuốc)
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Search
                    placeholder="Tìm theo tên thuốc"
                    allowClear
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 300 }}
                    value={searchText}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Table
                    rowKey="_id"
                    dataSource={medicines}
                    columns={columns}
                    scroll={{ x: 1000, y: 400 }}
                    bordered
                    size="small"
                />
            )}

            {/* Hiển thị danh sách thuốc đã chọn */}
            {/* {selectedMedicines.length > 0 && (
                <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                    <Title level={5}>Thuốc đã chọn:</Title>
                    {selectedMedicines.map(medicine => (
                        <div key={medicine._id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 16, 
                            marginBottom: 8,
                            padding: 8,
                            backgroundColor: 'white',
                            borderRadius: 4
                        }}>
                            <div style={{ flex: 1 }}>
                                <strong>{medicine.name}</strong>
                                <br />
                                <small>{medicine.type}{medicine.group ? ` - ${medicine.group}` : ''}</small>
                            </div>
                            <div style={{ width: 100 }}>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Số lượng"
                                    value={quantities[medicine._id] || 1}
                                    onChange={(e) => handleQuantityChange(medicine._id, parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <Button 
                                size="small" 
                                danger 
                                onClick={() => handleMedicineSelect(medicine, false)}
                            >
                                Xóa
                            </Button>
                        </div>
                    ))}
                </div>
            )} */}
        </Modal>
    );
};

export default Prescription;