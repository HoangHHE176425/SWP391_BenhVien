import React, { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Spin, message, Tabs, Badge } from 'antd';
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
    showSizeChanger: false, // Tắt thay đổi pageSize
  });
  const [selectedDate, setSelectedDate] = useState(new Date('2025-08-02')); // Ngày mặc định
  const doctor = JSON.parse(localStorage.getItem("user"));

  // Hàm debounce tự viết
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Hàm format ngày thành DD/MM/YYYY
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return 'Không hợp lệ';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Hàm format ngày thành YYYY-MM-DD cho input date
  const formatDateForInput = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Hàm fetch lịch hẹn
  const fetchAppointments = useCallback(
    debounce(async (doctorId, page, pageSize, date) => {
      try {
        setLoading(true);
        // Kiểm tra ngày hợp lệ
        if (!(date instanceof Date) || isNaN(date)) {
          throw new Error('Ngày không hợp lệ');
        }
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const params = {
          doctorId,
          status: ['confirmed', 'waiting_for_doctor'],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page,
          limit: pageSize,
        };
        const res = await axios.get('/api/apm', { params });

        console.log('API Response:', res.data); // Debug dữ liệu API

        if (res.data && Array.isArray(res.data.appointments)) {
          const { appointments } = res.data;
          // Lọc lại ở client để đảm bảo chỉ hiển thị trạng thái mong muốn
          const filteredAppointments = appointments.filter(appt =>
            ['confirmed', 'waiting_for_doctor'].includes(appt.status)
          );
          setAppointments(filteredAppointments);
          // Tổng số chỉ tính lịch hẹn hiển thị
          setPagination((prev) => ({
            ...prev,
            current: page,
            total: filteredAppointments.length, // Chỉ lấy số lịch hẹn hiển thị
          }));

          if (filteredAppointments.length === 0) {
            message.info(`Không có lịch hẹn cho ngày ${formatDate(date)}.`);
          }
        } else {
          setAppointments([]);
          message.error('Dữ liệu lịch hẹn không hợp lệ hoặc không phải mảng.');
        }
      } catch (err) {
        console.error('Lỗi fetch:', err);
        message.error(`Không thể tải lịch hẹn: ${err.message}`);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Gọi API khi doctorId, pagination hoặc selectedDate thay đổi
  useEffect(() => {
    if (doctor?._id) {
      fetchAppointments(doctor._id, pagination.current, pagination.pageSize, selectedDate);
    } else {
      message.error('Không tìm thấy thông tin bác sĩ.');
      setLoading(false);
    }
  }, [doctor?._id, pagination.current, pagination.pageSize, selectedDate, fetchAppointments]);

  // Xử lý khi thay đổi trang
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchAppointments(doctor._id, newPagination.current, newPagination.pageSize, selectedDate);
  };

  // Xử lý khi chọn ngày
  const handleDateChange = (event) => {
    const dateString = event.target.value; // Chuỗi định dạng YYYY-MM-DD
    if (dateString) {
      const newDate = new Date(dateString);
      if (!isNaN(newDate)) {
        setSelectedDate(newDate);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset về trang 1
      } else {
        message.error('Ngày được chọn không hợp lệ.');
      }
    }
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 60,
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
      render: (date) => date ? new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'Không có dữ liệu',
      width: 180,
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
  ];

  // Phân loại appointments theo trạng thái
  const waitingAppointments = appointments.filter(appt => appt.status === 'waiting_for_doctor');
  const confirmedAppointments = appointments.filter(appt => appt.status === 'confirmed');

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ background: '#1890ff', padding: '20px', borderRadius: '10px 10px 0 0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, fontWeight: 'bold' }}>
          Lịch hẹn của bác sĩ: {doctor?.name} (ngày {formatDate(selectedDate)}) - Tổng số: {appointments.length}
        </Title>
        <input
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          style={{
            width: '150px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #d9d9d9',
            fontSize: '14px',
          }}
        />
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin size="large" />
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          Không có lịch hẹn cho ngày {formatDate(selectedDate)}.
        </div>
      ) : (
        <Tabs defaultActiveKey="1" style={{ background: '#fff', padding: '20px', borderRadius: '0 0 10px 10px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <TabPane tab={<span><Badge status="warning" /> Đợi khám ({waitingAppointments.length})</span>} key="1">
            <Table
              rowKey="_id"
              dataSource={waitingAppointments}
              columns={columns}
              pagination={appointments.length <= pagination.pageSize ? false : pagination} // Ẩn phân trang nếu tổng số nhỏ hơn hoặc bằng pageSize
              onChange={handleTableChange}
              style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}
              scroll={{ x: 900 }}
            />
          </TabPane>
          <TabPane tab={<span><Badge status="success" /> Đã đặt lịch ({confirmedAppointments.length})</span>} key="2">
            <Table
              rowKey="_id"
              dataSource={confirmedAppointments}
              columns={columns}
              pagination={appointments.length <= pagination.pageSize ? false : pagination} // Ẩn phân trang nếu tổng số nhỏ hơn hoặc bằng pageSize
              onChange={handleTableChange}
              style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}
              scroll={{ x: 900 }}
            />
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default DoctorAppointments;
