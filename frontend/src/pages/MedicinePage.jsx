import React, { useEffect, useState } from 'react';
import { Table, Typography, Spin, message, Tooltip, Input } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { Search } = Input;

const MedicinePage = () => {
    const [medicines, setMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await axios.get('/api/medicines');
            setMedicines(res.data);
            setFilteredMedicines(res.data);
        } catch (err) {
            message.error('Không thể tải danh sách thuốc');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = medicines.filter((medicine) =>
            medicine.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredMedicines(filtered);
    };

    const columns = [
        {
            title: 'Tên thuốc',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            sorter: (a, b) => a.type.localeCompare(b.type),
        },
        {
            title: 'Nhóm',
            dataIndex: 'group',
            key: 'group',
            sorter: (a, b) => a.group.localeCompare(b.group),
        },
        {
            title: 'Chỉ định',
            dataIndex: 'indication',
            key: 'indication',
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
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Hạn sử dụng',
            dataIndex: 'expirationDate',
            key: 'expirationDate',
            sorter: (a, b) => new Date(a.expirationDate) - new Date(b.expirationDate),
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
    ];

    return (
        <div>
            <Title level={3}>Danh sách thuốc</Title>

            <Search
                placeholder="Tìm theo tên thuốc"
                allowClear
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300, marginBottom: 16 }}
                value={searchText}
            />

            {loading ? (
                <Spin />
            ) : (
                <Table
                    rowKey="_id"
                    dataSource={filteredMedicines}
                    columns={columns}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        pageSize: 10,
                        position: ['bottomCenter'], // 👈 canh giữa phân trang
                    }}
                    bordered
                />

            )}
        </div>
    );
};

export default MedicinePage;
