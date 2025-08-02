import React, { useEffect, useState } from 'react';
import { Table, Typography, Spin, message, Tabs, Button, Badge } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (doctor?._id) {
      fetchAppointments(doctor._id, pagination.current, pagination.pageSize);
    } else {
      message.error('Không tìm thấy thông tin bác sĩ.');
      setLoading(false);
    }
  }, [doctor?._id, pagination.current, pagination.pageSize]);

  const fetchAppointments = async (doctorId, page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const today = new Date('2025-08-02'); // Ngày cố định hôm nay
      const params = {
        doctorId,
        page,
        limit: pageSize,
      };
      const res = await axios.get(`/api/apm/queues`, { params });
      
      if (res.data && Array.isArray(res.data.queues)) {
        const { queues, total } = res.data;

        // Trích xuất và lọc lịch hẹn từ queueEntries
        const validAppointments = queues
          .flatMap(queue => 
            queue.queueEntries.map(entry => ({ ...entry, queue }))
          )
          .filter(entry => {
            const appt = entry.appointmentId;
            const apptDate = new Date(appt.appointmentDate).toISOString().split('T')[0];
            const validStatus = ['confirmed', 'waiting_for_doctor'].includes(appt.status);
            const isCorrectDoctor = entry.doctorId._id === doctorId;
            return apptDate === today.toISOString().split('T')[0] && validStatus && isCorrectDoctor;
          })
          .map(entry => ({
            _id: entry.appointmentId._id,
            appointmentDate: entry.appointmentId.appointmentDate,
            status: entry.appointmentId.status,
            profileId: entry.profileId, // Để hiển thị tên và phone
            symptoms: entry.appointmentId.symptoms, // Triệu chứng
            position: entry.position, // Vị trí trong hàng đợi
          }));

        console.log('Today:', today.toLocaleDateString('vi-VN'), 'Filtered appointments:', validAppointments);
        setAppointments(validAppointments);
        setPagination({
          current: page,
          pageSize,
          total: total || validAppointments.length,
        });

        if (validAppointments.length === 0) {
          message.info(`Không có lịch hẹn cho ngày ${today.toLocaleDateString('vi-VN')}.`);
        }
      } else {
        setAppointments([]);
        message.error('Dữ liệu lịch hẹn không hợp lệ.');
      }
    } catch (err) {
      console.error('Lỗi fetch:', err);
      message.error('Không thể tải lịch hẹn.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleCallPatient = async (apptId) => {
    const hide = message.loading('Đang gọi bệnh nhân...', 0);
    try {
      await axios.put(`/api/apm/call/${apptId}`);
      message.success(`Gọi bệnh nhân thành công cho lịch hẹn ${apptId}`);
      fetchAppointments(doctor._id, pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Không thể gọi bệnh nhân.');
    } finally {
      hide();
    }
  };

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 60,
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      sorter: (a, b) => a.position - b.position,
    },
    {
      title: 'Họ tên bệnh nhân',
      dataIndex: 'profileId',
      key: 'profileName',
      render: (profile) => profile?.name || 'Không có dữ liệu',
      width: 150,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'profileId',
      key: 'phone',
      render: (profile) => profile?.phone || 'Không có dữ liệu',
      width: 120,
    },
    {
      title: 'Triệu chứng',
      dataIndex: 'symptoms',
      key: 'symptoms',
      width: 200,
    },
    {
      title: 'Ngày hẹn',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Không có dữ liệu',
      width: 180,
    },
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'waiting_for_doctor' ? 'warning' : 'success'}
          text={status === 'waiting_for_doctor' ? 'Đợi khám' : 'Đã đặt lịch'}
        />
      ),
      width: 120,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleCallPatient(record._id)}
          disabled={!['waiting_for_doctor', 'confirmed'].includes(record.status)}
          style={{ borderRadius: '4px' }}
        >
          Gọi bệnh nhân
        </Button>
      ),
      width: 120,
    },
  ];

  // Phân loại appointments theo trạng thái
  const waitingAppointments = appointments.filter(appt => appt.status === 'waiting_for_doctor');
  const confirmedAppointments = appointments.filter(appt => appt.status === 'confirmed');

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ background: '#1890ff', padding: '20px', borderRadius: '10px 10px 0 0', color: 'white' }}>
        <Title level={3} style={{ margin: 0, fontWeight: 'bold' }}>
          Lịch hẹn của bác sĩ: {doctor?.name} (ngày {new Date('2025-08-02').toLocaleDateString('vi-VN')}) - Tổng số: {pagination.total}
        </Title>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin size="large" />
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          Không có lịch hẹn cho ngày {new Date('2025-08-02').toLocaleDateString('vi-VN')}.
        </div>
      ) : (
        <Tabs defaultActiveKey="1" style={{ background: '#fff', padding: '20px', borderRadius: '0 0 10px 10px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <TabPane tab={<span><Badge status="warning" /> Đợi khám ({waitingAppointments.length})</span>} key="1">
            <Table
              rowKey="_id"
              dataSource={waitingAppointments}
              columns={columns}
              pagination={pagination}
              onChange={handleTableChange}
              style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}
              scroll={{ x: 1000 }} // Giảm scroll vì ít cột hơn
            />
          </TabPane>
          <TabPane tab={<span><Badge status="success" /> Đã đặt lịch ({confirmedAppointments.length})</span>} key="2">
            <Table
              rowKey="_id"
              dataSource={confirmedAppointments}
              columns={columns}
              pagination={pagination}
              onChange={handleTableChange}
              style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}
              scroll={{ x: 1000 }} // Giảm scroll vì ít cột hơn
            />
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default DoctorAppointments;