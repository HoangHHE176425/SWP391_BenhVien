import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, Button, Input, DatePicker, Select, TimePicker,
  Space, Form, message, Typography, Divider, Modal, Popconfirm, Tag
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;


function StaffScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [autoForm] = Form.useForm();
  const token = localStorage.getItem("token"); 
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentDetailVisible, setDepartmentDetailVisible] = useState(false);

useEffect(() => {
  fetchSchedules();
  fetchDepartments();
}, []);


  useEffect(() => {
    let result = schedules;
    
    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(schedule => {
        const emp = schedule.employeeId;
        const name = typeof emp === 'object' ? emp.name?.toLowerCase() : '';
        const code = typeof emp === 'object' ? emp.employeeCode?.toLowerCase() : '';
        return name?.includes(lowerText) || code?.includes(lowerText);
      });
    }
    if (filterDepartment) {
      result = result.filter(schedule => {
        const depId = typeof schedule.department === 'object' ? schedule.department._id : schedule.department;
        return depId === filterDepartment;
      });
    }
    if (filterDate) {
      result = result.filter(schedule => 
        dayjs(schedule.date).format('YYYY-MM-DD') === filterDate.format('YYYY-MM-DD')
      );
    }


    setFilteredSchedules(result);
  }, [schedules, searchText, filterDepartment, filterDate]);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/staff/schedule-management/schedule');
      setSchedules(res.data);
    } catch (err) {
      message.error('Không thể lấy lịch');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/staff/departments');
      setDepartments(res.data);
    } catch (err) {
      message.error('Không thể tìm được các khoa');
    }
  };

  const fetchEmployeesByDepartment = async (departmentName) => {
    try {
      const res = await axios.get(`/api/staff/employees?department=${departmentName}`);
      setEmployees(res.data);
    } catch (err) {
      message.error('Không thể tìm được nhân viên');
    }
  };

  const handleDepartmentChange = (value) => {
    form.setFieldValue('employeeId', undefined);
    fetchEmployeesByDepartment(value); // `value` ở đây luôn là _id từ <Select>
  };
  const handleAutoGenerateSchedule = async (values) => {
  const { department, employeeId, workingShifts, dateRange } = values;
  const [startDateRaw, endDateRaw] = dateRange;

  if (!startDateRaw || !endDateRaw) {
    message.error('Vui lòng chọn khoảng ngày hợp lệ');
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    message.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
    return;
  }

  const startDate = dayjs(startDateRaw).startOf('day');
  const finalDate = dayjs(endDateRaw).startOf('day');
  let current = dayjs(startDate); // ✅ chỉ khai báo 1 lần

  const shiftMap = {
    morning: { start: "08:00", end: "11:00" },
    afternoon: { start: "13:00", end: "17:00" },
    night: { start: "22:00", end: "06:00" },
  };

  try {
    while (current.isSameOrBefore(finalDate, 'day')) {
      const timeSlots = [];

      workingShifts.forEach(({ shift, status }) => {
        const { start, end } = shiftMap[shift];
        const [startHour, startMinute] = start.split(':');
        const [endHour, endMinute] = end.split(':');

        const startTime = current.hour(startHour).minute(startMinute);
        let endTime = current.hour(endHour).minute(endMinute);

        if (shift === "night") {
          endTime = endTime.add(1, 'day');
        }

        timeSlots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: status || "Available"
        });
      });

      const payload = {
        department,
        employeeId,
        date: current.format('YYYY-MM-DD'),
        timeSlots
      };

      await axios.post(
        '/api/staff/schedule-management/schedule',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      current = current.add(1, 'day');
    }

    const totalDays = finalDate.diff(startDate, 'day') + 1;
    message.success(`Tạo lịch tự động thành công cho ${totalDays} ngày`);
    setAutoModalVisible(false);
    autoForm.resetFields();
    fetchSchedules();
  } catch (error) {
    console.error("❌ Lỗi tạo lịch:", error);
    message.error("Không thể tạo lịch tự động");
  }
};

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/staff/schedule-management/schedule/${id}`);
      message.success('Lịch đã xóa');
      fetchSchedules();
    } catch (err) {
      message.error('Không xóa được lịch');
    }
  };

  const onFinish = async (values) => {
    const payload = {
      employeeId: values.employeeId,
      department: values.department,
      date: values.date.format('YYYY-MM-DD'),
      timeSlots: values.timeSlots.map(slot => ({
        startTime: slot.timeRange[0].toISOString(),
        endTime: slot.timeRange[1].toISOString(),
        status: slot.status
      }))
    };

    try {
      if (editingId) {
        await axios.put(`/api/staff/schedule-management/schedule/${editingId}`, payload);
        message.success('Lịch trình đã cập nhật');
      } else {
        await axios.post('/api/staff/schedule-management/schedule', payload);
        message.success('Lịch đã được tạo');
      }

      form.resetFields();
      setEditingId(null);
      setIsModalVisible(false);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi lưu lịch');
    }
  };

  const handleEdit = async (record) => {
    const depId = typeof record.department === 'object' ? record.department._id : record.department;
    await fetchEmployeesByDepartment(depId);

    form.setFieldsValue({
      employeeId: typeof record.employeeId === 'object' ? record.employeeId._id : record.employeeId,
      department: depId,
      date: dayjs(record.date),
      timeSlots: record.timeSlots.map(slot => ({
        timeRange: [dayjs(slot.startTime), dayjs(slot.endTime)],
        status: slot.status
      }))
    });

    setEditingId(record._id);
    setIsModalVisible(true);
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterDepartment(null);
    setFilterDate(null);
  };

  // Disable past dates in DatePicker
  const disabledDate = (current) => {
    // Can not select days before today
    return current && current < dayjs().startOf('day');
  };

  const columns = [
    {
      title: 'Bác sĩ',
      dataIndex: 'employeeId',
      render: emp => {
        const employee = typeof emp === 'object' ? emp : employees.find(e => e._id === emp);
        if (!employee) return 'N/A';

        return (
          <Button type="link" onClick={() => {
            setSelectedEmployee(employee);
            setDetailModalVisible(true);
          }}>
            {employee.employeeCode || employee._id}
          </Button>
        );
      }
    },
    {
      title: 'Khoa',
      dataIndex: 'department',
      render: (depId) => {
        const department = departments.find(d => d._id === (depId?._id || depId));
        if (!department) return <Tag color="red">Đã bị vô hiệu</Tag>;
        if (!department) return 'N/A';

        return (
          <Button type="link" onClick={() => {
            setSelectedDepartment(department);
            setDepartmentDetailVisible(true);
          }}>
            {department.departmentCode || department.name}
          </Button>
        );
      }
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      render: date => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Khung giờ',
      dataIndex: 'timeSlots',
      render: slots => (
        <ul style={{ marginBottom: 0 }}>
          {slots.map((s, idx) => (
            <li key={idx}>
              {dayjs(s.startTime).format('HH:mm')} - {dayjs(s.endTime).format('HH:mm')}
            </li>
          ))}
        </ul>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'timeSlots',
      render: slots => (
        <ul style={{ marginBottom: 0 }}>
          {slots.map((slot, idx) => (
            <li key={idx}>
              <Tag color={
                slot.status === 'Available'
                  ? 'green'
                  : slot.status === 'Booked'
                  ? 'volcano'
                  : slot.status === 'Unavailable'
                  ? 'red'
                  : 'default'
              }>
                {slot.status}
              </Tag>
            </li>
          ))}
        </ul>
      )
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Đồng ý"
            cancelText="Không"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Quản lý lịch bác sĩ</Title>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm theo tên hoặc mã bác sĩ"
          onSearch={value => setSearchText(value)}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
          value={searchText}
        />
        <Select
          placeholder="Lọc theo phòng ban"
          allowClear
          style={{ width: 200 }}
          onChange={value => setFilterDepartment(value)}
          value={filterDepartment}
        >
        {departments
          .filter(dep => dep.status === 'active')
          .map(dep => (
            <Option key={dep._id} value={dep._id}>{dep.name}</Option>
        ))}
        </Select>
        <DatePicker
          placeholder="Lọc theo ngày"
          onChange={value => setFilterDate(value)}
          style={{ width: 200 }}
          value={filterDate}
        />
        <Button onClick={clearFilters}>Xóa Filter</Button>
        <Button type="default" onClick={() => setAutoModalVisible(true)}>
          Tạo lịch tự động
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditingId(null);
            setIsModalVisible(true);
          }}
        >
          Thêm lịch
        </Button>
      </Space>

      <Divider />

      <Table rowKey="_id" dataSource={filteredSchedules} columns={columns} />

      <Modal
        title={editingId ? "Chỉnh sửa lịch" : "Tạo lịch"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        onOk={() => form.submit()}
        okText={editingId ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Khoa"
            name="department"
            rules={[{ required: true, message: 'Vui lòng chọn khoa' }]}
          >
            <Select placeholder="Chọn khoa" onChange={handleDepartmentChange}>
              {departments
                .filter(dep => dep.status === 'active')
                .map(dep => (
                  <Option key={dep._id} value={dep._id}>{dep.name}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Bác sĩ"
            name="employeeId"
            rules={[{ required: true, message: 'Vui lòng chọn bác sĩ' }]}
          >
            <Select placeholder="Chọn bác sĩ" allowClear>
              {employees.map(emp => (
                <Option key={emp._id} value={emp._id}>{emp.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>
          <Form.List name="timeSlots" initialValue={[{ timeRange: [], status: 'Available' }]}>
  {(fields, { add, remove }) => (
    <>
      {fields.map(({ key, name, ...restField }, index) => (
        <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
          <Form.Item
            {...restField}
            name={[name, 'timeRange']}
            rules={[
              { required: true, message: 'Chọn khoảng thời gian' },
              {
                validator: async (_, value) => {
                  if (!value || value.length !== 2) return;

                  const allSlots = form.getFieldValue('timeSlots');
                  const currentStart = value[0];
                  const currentEnd = value[1];

                  if (!currentStart || !currentEnd) return;

                  const hasOverlap = allSlots.some((slot, idx) => {
                    if (idx === index) return false; // skip current
                    const [start, end] = slot.timeRange || [];
                    if (!start || !end) return false;
                    return (
                      currentStart.isBefore(end) &&
                      currentEnd.isAfter(start)
                    );
                  });

                  if (hasOverlap) {
                    throw new Error('Khung giờ bị trùng với khoảng khác');
                  }
                }
              }
            ]}
          >
            <TimePicker.RangePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            {...restField}
            name={[name, 'status']}
            rules={[{ required: true, message: 'Chọn trạng thái' }]}
          >
            <Select style={{ width: 120 }}>
              <Option value="Available">Available</Option>
              <Option value="Booked">Booked</Option>
            </Select>
          </Form.Item>

          <Button danger onClick={() => remove(name)}>X</Button>
        </Space>
      ))}
      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
        Thêm khung giờ
      </Button>
    </>
  )}
</Form.List>

        </Form>
      </Modal>
      <Modal
  title="Tạo lịch tự động"
  open={autoModalVisible}
  onCancel={() => {
    setAutoModalVisible(false);
    autoForm.resetFields();
  }}
  onOk={() => autoForm.submit()}
  okText="Tạo"
>
  <Form form={autoForm} layout="vertical" onFinish={handleAutoGenerateSchedule}>
    <Form.Item
      name="department"
      label="Khoa"
      rules={[{ required: true, message: 'Chọn khoa' }]}
    >
      <Select onChange={fetchEmployeesByDepartment} placeholder="Chọn khoa">
        {departments
          .filter(dep => dep.status === 'active')
          .map(dep => (
            <Option key={dep._id} value={dep._id}>{dep.name}</Option>
          ))}
      </Select>
    </Form.Item>
    <Form.Item
      name="employeeId"
      label="Bác sĩ"
      rules={[{ required: true, message: 'Chọn bác sĩ' }]}
    >
      <Select placeholder="Chọn bác sĩ">
        {employees.map(emp => (
          <Option key={emp._id} value={emp._id}>{emp.name}</Option>
        ))}
      </Select>
    </Form.Item>

<Form.List name="workingShifts" initialValue={[{ shift: 'morning', status: 'Available' }]}>
  {(fields, { add, remove }) => (
    <>
      {fields.map(({ key, name, ...restField }, index) => (
        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Form.Item
            {...restField}
            name={[name, 'shift']}
            rules={[
              { required: true, message: 'Chọn ca làm' },
              {
                validator: (_, value) => {
                  const allShifts = autoForm.getFieldValue('workingShifts') || [];
                  const duplicateCount = allShifts.filter((item, idx) =>
                    idx !== index && item?.shift === value
                  ).length;

                  if (duplicateCount > 0) {
                    return Promise.reject(new Error('Ca làm bị trùng'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select placeholder="Ca làm việc">
              <Option value="morning">Ca sáng (08:00 - 11:00)</Option>
              <Option value="afternoon">Ca chiều (13:00 - 17:00)</Option>
              <Option value="night">Trực đêm (22:00 - 06:00)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            {...restField}
            name={[name, 'status']}
            rules={[{ required: true, message: 'Chọn trạng thái' }]}
          >
            <Select placeholder="Trạng thái" style={{ width: 120 }}>
              <Option value="Available">Available</Option>
              <Option value="Booked">Booked</Option>
              <Option value="Unavailable">Unavailable</Option>
            </Select>
          </Form.Item>

          <Button danger onClick={() => remove(name)}>X</Button>
        </Space>
      ))}
      <Button
        type="dashed"
        onClick={() => add()}
        icon={<PlusOutlined />}
        disabled={fields.length >= 3}
      >
        Thêm ca
      </Button>
      {fields.length >= 3 && (
        <div style={{ color: 'red' }}>Chỉ được chọn tối đa 3 ca làm việc.</div>
      )}
    </>
  )}
</Form.List>


    <Form.Item
      name="dateRange"
      label="Chọn khoảng ngày"
      rules={[{ required: true, message: 'Chọn khoảng ngày' }]}
    >
      <DatePicker.RangePicker disabledDate={disabledDate} style={{ width: '100%' }} />
    </Form.Item>

  </Form>
</Modal>
<Modal
  title="Chi tiết bác sĩ"
  open={detailModalVisible}
  onCancel={() => setDetailModalVisible(false)}
  footer={null}
>
  {selectedEmployee ? (
    <div>
      <p><strong>Tên:</strong> {selectedEmployee.name}</p>
      <p><strong>Email:</strong> {selectedEmployee.email}</p>
      <p><strong>Số điện thoại:</strong> {selectedEmployee.phone}</p>
      <p><strong>Chuyên môn:</strong> {selectedEmployee.specialization}</p>
      <p><strong>Bằng cấp:</strong> {selectedEmployee.degree}</p>
      <p><strong>Năm kinh nghiệm:</strong> {selectedEmployee.expYear}</p>
      <p><strong>Vai trò:</strong> {selectedEmployee.role}</p>
      <p><strong>Trạng thái:</strong> {selectedEmployee.status}</p>
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


export default StaffScheduleManager;
