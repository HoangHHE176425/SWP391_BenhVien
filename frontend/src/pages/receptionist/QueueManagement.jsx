import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  Table, Button, Input, DatePicker, Select,
  Space, message, Typography, Divider, Modal, Tag, Spin, Pagination
} from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

dayjs.extend(isSameOrBefore);

function QueueManagement() {
  const [queues, setQueues] = useState([]);
  const [filteredQueues, setFilteredQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterRole, setFilterRole] = useState('Doctor');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [departmentDetailVisible, setDepartmentDetailVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [viewQueueDoctor, setViewQueueDoctor] = useState(null);

  const token = localStorage.getItem("token");
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    fetchDepartments();
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    if (viewQueueDoctor) {
      fetchQueues(viewQueueDoctor._id);
    }
  }, [viewQueueDoctor, currentPage]);

  useEffect(() => {
    let result = queues;
    if (dateFilter) {
      result = result.filter(q =>
        dayjs(q.date).format('YYYY-MM-DD') === dateFilter.format('YYYY-MM-DD')
      );
    }
    setFilteredQueues(result);
  }, [queues, dateFilter]);

  const fetchAllDoctors = async () => {
    try {
      const res = await axios.get('/api/receptionist/employees/all');
      const doctorsList = res.data.filter(emp => emp.role === 'Doctor');
      setDoctors(doctorsList);
    } catch (err) {
      message.error('Không thể tải danh sách bác sĩ');
    }
  };

  const fetchQueues = async (doctorId) => {
    setLoading(true);
    try {
      const params = {
        doctorId,
        page: currentPage,
        limit: itemsPerPage,
      };
      const res = await axios.get("http://localhost:9999/api/apm/queues", { params });
      console.log("API Response for doctorId", doctorId, ":", res.data);
      setQueues(res.data.queues || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Lỗi tải danh sách hàng đợi:", err.response?.data || err.message);
      setError("Không tải được danh sách hàng đợi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/receptionist/departments');
      setDepartments(res.data || []);
    } catch (err) {
      message.error('Không thể tìm được các khoa');
    }
  };

  const handleViewQueue = (doctor) => {
    setViewQueueDoctor(doctor);
    setDateFilter(null);
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterDepartment(null);
    setFilterRole('Doctor');
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "Chưa có";
    return dayjs(isoString).format("DD/MM/YYYY HH:mm");
  };

  const doctorColumns = [
    {
      title: 'Mã bác sĩ',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      render: (_, record) => (
        <Button type="link" onClick={() => {
          setSelectedDoctor(record);
          setDetailModalVisible(true);
        }}>
          {record.employeeCode}
        </Button>
      )
    },
    {
      title: 'Khoa',
      render: (record) => {
        if (!record.department) return 'N/A';
        const depId = typeof record.department === 'object' ? record.department._id : record.department;
        const department = departments.find(d => d._id === depId);
        return department ? (
          <Button type="link" onClick={() => {
            setSelectedDepartment(department);
            setDepartmentDetailVisible(true);
          }}>
            {department.departmentCode || department.name}
          </Button>
        ) : 'N/A';
      }
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Hành động',
      render: (record) => (
        <Button type="link" onClick={() => handleViewQueue(record)}>
          Xem hàng đợi
        </Button>
      )
    }
  ];

  const queueColumns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Thời gian đặt lịch',
      key: 'appointmentTime',
      render: (entry) => formatDateTime(entry.appointmentId?.timeSlot?.startTime || entry.appointmentId?.appointmentDate)
    },
    {
      title: 'Bệnh nhân',
      render: (entry) => entry.profileId?.name || "Chưa có"
    },
    {
      title: 'SĐT',
      render: (entry) => entry.profileId?.phone || "Chưa có"
    },
    {
      title: 'Bác sĩ',
      render: (entry) => entry.doctorId?.name || "Chưa có"
    },
    {
      title: 'Triệu chứng',
      render: (entry) => entry.appointmentId?.symptoms || "Chưa có"
    },
    {
      title: 'Trạng thái',
      render: (entry) => (
        <Tag color={entry.status === "waiting_for_doctor" ? "warning" : "default"}>
          {entry.status === "waiting_for_doctor" ? "Đang chờ" : entry.status}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Quản lý hàng đợi</Title>

      {!viewQueueDoctor ? (
        // Hiển thị danh sách bác sĩ
        <>
          <Divider />
          <Title level={4}>Danh sách bác sĩ</Title>

          <Space style={{ marginBottom: 16 }} wrap>
            <Search
              placeholder="Tìm theo tên hoặc mã bác sĩ"
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              style={{ width: 300 }}
              allowClear
            />
            {/* <Select
              placeholder="Lọc theo vai trò"
              style={{ width: 200 }}
              allowClear
              value={filterRole}
              onChange={setFilterRole}
              disabled
            >
              <Option value="Doctor">Bác sĩ</Option>
            </Select> */}
            <Select
              placeholder="Lọc theo khoa"
              style={{ width: 200 }}
              allowClear
              value={filterDepartment}
              onChange={setFilterDepartment}
            >
              {departments.map(dep => (
                <Option key={dep._id} value={dep._id}>
                  {dep.name}
                </Option>
              ))}
            </Select>
            <Button onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </Space>

          <Table
            rowKey="_id"
            dataSource={doctors.filter(emp => {
              const lower = searchText.toLowerCase();
              const matchText =
                emp.name?.toLowerCase().includes(lower) ||
                emp.employeeCode?.toLowerCase().includes(lower);
              const matchRole = filterRole ? emp.role === filterRole : true;
              const matchDepartment = filterDepartment
                ? emp.department === filterDepartment || emp.department?._id === filterDepartment
                : true;
              return matchText && matchRole && matchDepartment;
            })}
            columns={doctorColumns}
          />
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setViewQueueDoctor(null);
                setQueues([]);
              }}
            >
              Quay lại
            </Button>
          </div>

          <Space style={{ marginBottom: 16 }} wrap>
            <DatePicker
              placeholder="Lọc theo ngày"
              onChange={value => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
              style={{ width: 200 }}
              value={dateFilter}
              allowClear
            />
            <Button onClick={() => fetchQueues(selectedDoctor._id)}>Tải lại</Button>
          </Space>

          <Divider />
          <Title level={4}>Hàng đợi của {viewQueueDoctor.name}</Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'red' }}>
              <h5>{error}</h5>
              <Button type="primary" onClick={() => fetchQueues(selectedDoctor._id)}>
                Thử lại
              </Button>
            </div>
          ) : queues.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Không có hàng đợi nào.</p>
          ) : (
            <Table
              rowKey="_id"
              dataSource={filteredQueues
                .flatMap(q => q.queueEntries.filter(entry =>
                  entry.doctorId?._id === viewQueueDoctor._id || entry.doctorId === viewQueueDoctor._id
                ))}
              columns={queueColumns}
              pagination={false}
            />
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={itemsPerPage}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}

      <Modal
        title="Chi tiết bác sĩ"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
      >
        {selectedDoctor ? (
          <div>
            <p><strong>Tên:</strong> {selectedDoctor.name}</p>
            <p><strong>Email:</strong> {selectedDoctor.email}</p>
            <p><strong>Vai trò:</strong> {selectedDoctor.role}</p>
            <p><strong>Trạng thái:</strong> {selectedDoctor.status}</p>
            {/* <p><strong>Khoa:</strong> {selectedDoctor.department?.name || 'Không rõ'}</p> */}
            <p><strong>Chuyên môn:</strong> {selectedDoctor.specialization}</p>
            <p><strong>Số điện thoại:</strong> {selectedDoctor.phone}</p>
          </div>
        ) : (
          <p>Đang tải...</p>
        )}
      </Modal>

      <Modal
        title="Chi tiết khoa"
        open={departmentDetailVisible}
        onCancel={() => setDepartmentDetailVisible(false)}
        footer={null}
      >
        {selectedDepartment ? (
          <div>
            <p><strong>Mã khoa:</strong> {selectedDepartment.departmentCode}</p>
            <p><strong>Tên khoa:</strong> {selectedDepartment.name}</p>
            <p><strong>Mô tả:</strong> {selectedDepartment.description || 'Không có'}</p>
            {selectedDepartment.image && (
              <img
                src={selectedDepartment.image}
                alt="Ảnh khoa"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
          </div>
        ) : (
          <p>Đang tải...</p>
        )}
      </Modal>
    </div>
  );
}

export default QueueManagement;