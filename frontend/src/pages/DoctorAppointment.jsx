import React, { useEffect, useState } from 'react';
import { Table, Typography, Spin, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (doctor?._id) fetchAppointments(doctor._id);
    else {
      message.error('Không tìm thấy thông tin bác sĩ đăng nhập.');
      setLoading(false);
    }
  }, []);

  const fetchAppointments = async (doctorId) => {
    try {
      const res = await axios.get(`/api/apm`, {
        params: { doctorId },
      });
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Họ tên bệnh nhân',
      dataIndex: 'profileId',
      key: 'profileName',
      render: (profile) => profile?.fullName || 'Không có dữ liệu',
    },

    {
      title: 'Ngày hẹn',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Lịch hẹn của bác sĩ: {doctor?.name}</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table
          rowKey="_id"
          dataSource={appointments}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;