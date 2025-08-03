import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import {
  Table, Button, Input, DatePicker, Select, TimePicker,
  Space, Form, message, Typography, Divider, Modal, Tag, Switch 
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

function ReceptionistScheduleManager() {
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
  const [filterRole, setFilterRole] = useState(null);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [autoForm] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentDetailVisible, setDepartmentDetailVisible] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedScheduleLog, setSelectedScheduleLog] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployeeForLogs, setSelectedEmployeeForLogs] = useState(null);
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState(null);
  const token = localStorage.getItem("token"); 
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    fetchDepartments();
    fetchAllEmployees();
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
    if (filterRole) {
      result = result.filter(schedule => {
        const emp = schedule.employeeId;
        const role = typeof emp === 'object' ? emp.role : '';
        return role === filterRole;
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
    if (filterAttendanceStatus) {
      result = result.filter(schedule => schedule.attendanceStatus === filterAttendanceStatus);
    }

    setFilteredSchedules(result);
 }, [schedules, searchText, filterDepartment, filterDate, filterRole, filterAttendanceStatus]);

  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get('/api/receptionist/employees/all');
      setEmployeeList(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  const fetchSchedules = async (employeeId) => {
  try {
    const url = employeeId 
      ? `/api/receptionist/schedule-management/schedule?employeeId=${employeeId}`
      : '/api/receptionist/schedule-management/schedule';

    const scheduleRes = await axios.get(url);
    const schedulesWithAttendance = await Promise.all(
      scheduleRes.data.map(async (schedule) => {
        try {
          const attendanceRes = await axios.get(`/api/receptionist/schedule-management/schedule/${schedule._id}/attendances`);
          schedule.attendanceStatus = attendanceRes.data?.[0]?.status || 'Chưa điểm danh';
        } catch {
          schedule.attendanceStatus = 'Chưa điểm danh';
        }
        return schedule;
      })
    );

    const sortedSchedules = schedulesWithAttendance.sort((a, b) => {
  const dateA = dayjs(a.date).valueOf();
  const dateB = dayjs(b.date).valueOf();

  // Nếu cùng ngày thì so sánh theo giờ bắt đầu khung giờ đầu tiên
  if (dateA === dateB) {
    const aStart = a.timeSlots?.[0]?.startTime ? dayjs(a.timeSlots[0].startTime).valueOf() : 0;
    const bStart = b.timeSlots?.[0]?.startTime ? dayjs(b.timeSlots[0].startTime).valueOf() : 0;
    return aStart - bStart;
  }

  return dateA - dateB;
});
setSchedules(sortedSchedules);

  } catch (err) {
    message.error('Không thể lấy lịch');
  }
};


  const fetchScheduleLogs = async (schedule) => {
    try {
      const res = await axios.get(`/api/receptionist/schedule-management/schedule-log/${schedule._id}`);
      setLogs(res.data);
      setSelectedScheduleLog(schedule);
      setLogVisible(true);
    } catch (err) {
      message.error('Không thể tải log lịch làm việc');
    }
  };

  const toggleScheduleStatus = async (record) => {
    try {
      const isInactive = record.timeSlots.every(slot => slot.status === "Unavailable");
      const updatedSlots = record.timeSlots.map(slot => ({
        ...slot,
        status: isInactive ? "Available" : "Unavailable"
      }));

      await axios.put(`/api/receptionist/schedule-management/schedule/${record._id}`, {
        employeeId: record.employeeId._id || record.employeeId,
        department: record.department._id || record.department,
        date: record.date,
        timeSlots: updatedSlots
      });

      message.success("Cập nhật tình trạng thành công");
      fetchSchedules(selectedEmployeeForLogs?._id);
    } catch (err) {
      console.error("Toggle status failed:", err);
      message.error("Không thể cập nhật tình trạng");
    }
  };

  const toggleOverallStatus = async (record) => {
    try {
      await axios.put(`/api/receptionist/schedule-management/schedule/${record._id}/toggle-status`);
      message.success("Cập nhật trạng thái thành công");
      fetchSchedules(selectedEmployeeForLogs?._id);
    } catch (err) {
      console.error("Toggle schedule status failed:", err);
      message.error("Không thể cập nhật trạng thái");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/receptionist/departments');
      setDepartments(res.data);
    } catch (err) {
      message.error('Không thể tìm được các khoa');
    }
  };

  const fetchEmployeesByDepartment = async (departmentId) => {
    try {
      const res = await axios.get(`/api/receptionist/employees?department=${departmentId}`);
      setEmployees(res.data);
    } catch (err) {
      message.error('Không thể tìm được nhân viên');
    }
  };

  const isTimeOverlap = (startA, endA, startB, endB) => {
    return dayjs(startA).isBefore(endB) && dayjs(endA).isAfter(startB);
  };

  const handleDepartmentChange = (value) => {
    form.setFieldValue('employeeId', undefined);
    fetchEmployeesByDepartment(value);
  };
  
  const markAsOnLeave = async (scheduleId) => {
    try {
      await axios.post(`/api/receptionist/attendance/on-leave`, { scheduleId });

      message.success("Đã cập nhật trạng thái nghỉ phép");
      if (selectedEmployeeForLogs) {
        fetchSchedules(selectedEmployeeForLogs._id);
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật trạng thái nghỉ phép");
    }
  };


  const handleAutoGenerateSchedule = async (values) => {
    const { department, employeeId, workingShifts, dateRange } = values;
    const [startDateRaw, endDateRaw] = dateRange;

    if (!startDateRaw || !endDateRaw) {
      message.error('Vui lòng chọn khoảng ngày hợp lệ');
      return;
    }

    const startDate = dayjs(startDateRaw).startOf('day');
    const finalDate = dayjs(endDateRaw).startOf('day');
    let current = dayjs(startDate);

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

        await axios.post('/api/receptionist/schedule-management/schedule', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        current = current.add(1, 'day');
      }

      const totalDays = finalDate.diff(startDate, 'day') + 1;
      message.success(`Tạo lịch tự động thành công cho ${totalDays} ngày`);
      setAutoModalVisible(false);
      autoForm.resetFields();
      if (selectedEmployeeForLogs) {
        fetchSchedules(selectedEmployeeForLogs._id);
      }
    } catch (error) {
      console.error("❌ Lỗi tạo lịch:", error);
      message.error("Không thể tạo lịch tự động");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/receptionist/schedule-management/schedule/${id}`);
      message.success('Lịch đã xóa');
      fetchSchedules(selectedEmployeeForLogs?._id);
    } catch (err) {
      message.error('Không xóa được lịch');
    }
  };

  const handleViewScheduleHistory = async (employee) => {
    setSelectedEmployeeForLogs(employee);
    try {
      await fetchSchedules(employee._id);
      const logsRes = await axios.get(`/api/receptionist/schedule-management/schedule-log/${employee._id}`);
      setLogs(logsRes.data);
    } catch (err) {
      message.error('Không thể lấy lịch hoặc log của nhân viên');
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
    setFilterRole(null);
    setFilterAttendanceStatus(null);
  };

  const disabledDate = (current) => {
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
          <Button
            type="link"
            onClick={() => {
              const departmentObject = departments.find(dep =>
                dep._id === (employee.department?._id || employee.department)
              );
              setSelectedEmployee({
                ...employee,
                department: departmentObject || employee.department,
              });
              setDetailModalVisible(true);
            }}
          >
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
      title: 'Khung giờ & Trạng thái',
      dataIndex: 'timeSlots',
      render: (slots) => (
        <ul style={{ marginBottom: 0, paddingLeft: 16 }}>
          {slots.map((slot, idx) => (
            <li key={idx}>
              {dayjs(slot.startTime).format('HH:mm')} - {dayjs(slot.endTime).format('HH:mm')}{' '}
              <Tag color={
                slot.status === 'Available' ? 'green' :
                slot.status === 'Booked' ? 'volcano' :
                slot.status === 'Unavailable' ? 'red' : 'default'
              }>
                {slot.status}
              </Tag>
            </li>
          ))}
        </ul>
      )
    },
    {
  title: 'Tình trạng điểm danh',
  dataIndex: 'attendanceStatus',
  render: (status) => {
    const statusMap = {
      Present: { color: "green", label: "Hoàn thành" },
      "Late-Arrival": { color: "gold", label: "Đến muộn" },
      "Left-Early": { color: "blue", label: "Về sớm" },
      "Left-Late": { color: "orange", label: "Check-out muộn" },
      "Checked-In": { color: "processing", label: "Đang làm" },
      Absent: { color: "red", label: "Vắng mặt" },
      "On-Leave": { color: "cyan", label: "Nghỉ phép" },
      Invalid: { color: "default", label: "Không hợp lệ" },
    };

    const display = statusMap[status] || { color: "default", label: "Chưa điểm danh" };

    return <Tag color={display.color}>{display.label}</Tag>;
  }
},
    {
      title: 'Tình trạng lịch làm việc',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Sửa</Button>
          <Switch
            checked={record.status === 'active'}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
            onChange={() => toggleOverallStatus(record)}
          />
          <Button type="link" onClick={() => fetchScheduleLogs(record)}>Xem log</Button>
          <Button type="link" danger onClick={() => markAsOnLeave(record._id)}>
            Nghỉ phép
          </Button>
        </Space>
      )
    }
  ];

  const employeeColumns = [
    {
      title: 'Mã nhân viên',
      dataIndex: 'employeeCode',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedEmployee(record);
            setDetailModalVisible(true);
          }}
        >
          {record.employeeCode}
        </Button>
      )
    },
{
  title: 'Khoa',
  render: (record) => {
    if (!record.department) return 'N/A';

    const depId =
      typeof record.department === 'object'
        ? record.department?._id
        : record.department;

    const department = departments.find(d => d._id === depId);

    return department ? (
      <Button
        type="link"
        onClick={() => {
          setSelectedDepartment(department);
          setDepartmentDetailVisible(true);
        }}
      >
        {department.departmentCode}
      </Button>
    ) : 'N/A';
  }
}
,
    {
      title: 'Tên',
      dataIndex: 'name',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
    },

    {
      title: 'Hành động',
      render: (record) => (
        <Button
          type="link"
          onClick={() => handleViewScheduleHistory(record)}
        >
          Xem lịch làm việc
        </Button>
      )
    }
  ];

  const onFinish = async (values) => {
  const { employeeId, department, date, timeSlots } = values;

  const baseDate = dayjs(date).startOf('day');

  const formattedTimeSlots = values.timeSlots.map(({ timeRange, status }) => {
  const [startRaw, endRaw] = timeRange;
  const baseDate = dayjs(values.date).startOf("day");

  const startTime = baseDate
    .hour(startRaw.hour())
    .minute(startRaw.minute())
    .second(0)
    .millisecond(0);

  const endTime = baseDate
    .hour(endRaw.hour())
    .minute(endRaw.minute())
    .second(0)
    .millisecond(0);

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status: status || "Available",
  };
});





const payload = {
  employeeId: values.employeeId,
  department: values.department,
  date: values.date.format('YYYY-MM-DD'),
  timeSlots: formattedTimeSlots
};

  const dateStr = baseDate.format('YYYY-MM-DD');

  const conflict = schedules.some((s) => {
    const sameEmp = s.employeeId === employeeId || s.employeeId?._id === employeeId;
    const sameDate = dayjs(s.date).format('YYYY-MM-DD') === dateStr;
    if (!sameEmp || !sameDate) return false;

    return s.timeSlots.some((existingSlot) =>
      timeSlots.some(({ timeRange }) =>
        isTimeOverlap(
          timeRange[0],
          timeRange[1],
          existingSlot.startTime,
          existingSlot.endTime
        )
      )
    );
  });

  if (conflict) {
    message.error('Khung giờ bị trùng với lịch đã có của bác sĩ trong ngày này.');
    return;
  }

  try {
    if (editingId) {
      await axios.put(`/api/receptionist/schedule-management/schedule/${editingId}`, payload);
      message.success('Lịch trình đã cập nhật');
    } else {
      await axios.post('/api/receptionist/schedule-management/schedule', payload);
      message.success('Lịch đã được tạo');
    }

    form.resetFields();
    setEditingId(null);
    setIsModalVisible(false);

    if (selectedEmployeeForLogs) {
      fetchSchedules(selectedEmployeeForLogs._id);
    }
  } catch (err) {
    console.error("❌ Lỗi khi lưu lịch:", err);
    message.error('Lỗi khi lưu lịch');
  }
};



  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Quản lý lịch làm việc</Title>

      {!selectedEmployeeForLogs ? (
<>
  <Divider />
  <Title level={4}>Danh sách nhân viên</Title>

  <Space style={{ marginBottom: 16 }} wrap>
    <Search
      placeholder="Tìm theo tên hoặc mã nhân viên"
      onSearch={(value) => setSearchText(value)}
      onChange={(e) => setSearchText(e.target.value)}
      value={searchText}
      style={{ width: 300 }}
      allowClear
    />
    <Select
      placeholder="Lọc theo vai trò"
      style={{ width: 200 }}
      allowClear
      value={filterRole}
      onChange={setFilterRole}
    >
      <Option value="Doctor">Bác sĩ</Option>
      <Option value="Pharmacist">Dược sĩ</Option>
      <Option value="Accountant">Kế toán</Option>
      <Option value="Receptionist">Lễ tân</Option>
      <Option value="HRManager">Quản lý nhân viên</Option>
    </Select>
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
    <Button onClick={() => {
      setSearchText('');
      setFilterRole(null);
      setFilterDepartment(null);
    }}>
      Xóa bộ lọc
    </Button>
  </Space>

  <Table
    rowKey="_id"
    dataSource={employeeList.filter(emp => {
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
    columns={employeeColumns}
  />
</>

      ) : (
        <>
          {/* Hàng 1: nút quay lại */}
<div style={{ marginBottom: 16 }}>
  <Button
    icon={<ArrowLeftOutlined />}
    onClick={() => {
      setSelectedEmployeeForLogs(null);
      setSchedules([]);
      setFilteredSchedules([]);
    }}
  >
    Quay lại
  </Button>
</div>

{/* Hàng 2: lọc và hành động */}
<Space style={{ marginBottom: 16 }} wrap>
  <DatePicker
    placeholder="Lọc theo ngày"
    onChange={value => setFilterDate(value)}
    style={{ width: 200 }}
    value={filterDate}
  />
  <Select
  placeholder="Lọc theo tình trạng điểm danh"
  style={{ width: 250 }}
  allowClear
  value={filterAttendanceStatus}
  onChange={setFilterAttendanceStatus}
>
  <Option value="Present">Hoàn thành</Option>
  <Option value="Late-Arrival">Đến muộn</Option>
  <Option value="Left-Early">Về sớm</Option>
  <Option value="Left-Late">Check-out muộn</Option>
  <Option value="Checked-In">Đang làm</Option>
  <Option value="Absent">Vắng mặt</Option>
  <Option value="On-Leave">Nghỉ phép</Option>
  <Option value="Invalid">Không hợp lệ</Option>
</Select>

  <Button onClick={clearFilters}>Xóa Filter</Button>

  <Button
    type="default"
    onClick={() => {
      if (selectedEmployeeForLogs) {
        const departmentId = typeof selectedEmployeeForLogs.department === 'object'
          ? selectedEmployeeForLogs.department._id
          : selectedEmployeeForLogs.department;

        autoForm.setFieldsValue({
          employeeId: selectedEmployeeForLogs._id,
          department: departmentId,
          workingShifts: [{ shift: 'morning', status: 'Available' }]
        });

        fetchEmployeesByDepartment(departmentId);
      } else {
        autoForm.resetFields();
      }
      setAutoModalVisible(true);
    }}
  >
    Tạo lịch tự động
  </Button>

  <Button
    type="primary"
    icon={<PlusOutlined />}
    onClick={() => {
      if (selectedEmployeeForLogs) {
        const departmentId = typeof selectedEmployeeForLogs.department === 'object'
          ? selectedEmployeeForLogs.department._id
          : selectedEmployeeForLogs.department;

        form.setFieldsValue({
          employeeId: selectedEmployeeForLogs._id,
          department: departmentId,
        });
        fetchEmployeesByDepartment(departmentId);
      }
      form.setFieldsValue({
        date: null,
        timeSlots: [{ timeRange: [], status: 'Available' }]
      });
      setEditingId(null);
      setIsModalVisible(true);
    }}
  >
    Thêm lịch
  </Button>
</Space>

          <Divider />
          <Title level={4}>Lịch làm việc của {selectedEmployeeForLogs.name}</Title>
          <Table rowKey="_id" dataSource={filteredSchedules} columns={columns} />
        </>
      )}

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
  <Select
    placeholder="Chọn khoa"
    onChange={handleDepartmentChange}
    disabled={!!selectedEmployeeForLogs}
  >
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
  <Select placeholder="Chọn bác sĩ" allowClear disabled={!!selectedEmployeeForLogs}>
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
                              if (idx === index) return false;
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
                {/* <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Thêm khung giờ
                </Button> */}
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
  <Select
    onChange={fetchEmployeesByDepartment}
    placeholder="Chọn khoa"
    disabled={!!selectedEmployeeForLogs}
  >
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
  <Select placeholder="Chọn bác sĩ" disabled={!!selectedEmployeeForLogs}>
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
                        <Option value="morning">Ca sáng (08:00 - 12:00)</Option>
                        <Option value="afternoon">Ca chiều (14:00 - 16:00)</Option>
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
                      </Select>
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>X</Button>
                  </Space>
                ))}
                {/* <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  disabled={fields.length >= 3}
                >
                  Thêm ca
                </Button> */}
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
            <p><strong>Vai trò:</strong> {selectedEmployee.role}</p>
            <p><strong>Trạng thái:</strong> {selectedEmployee.status}</p>
            <p><strong>Khoa:</strong> {selectedEmployee.department?.name || 'Không rõ'}</p>
            <p><strong>Chuyên môn:</strong> {selectedEmployee.specialization}</p>
            <p><strong>Số điện thoại:</strong> {selectedEmployee.phone}</p>
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

      <Modal
  title={
    <>
      <strong>Lịch sử log</strong> — {selectedScheduleLog?.employeeId?.name || '---'}{" "}
      <span style={{ color: "#888" }}>({selectedScheduleLog?.employeeId?.employeeCode || '—'})</span>
    </>
  }
  open={logVisible}
  onCancel={() => setLogVisible(false)}
  footer={null}
  width={700}
>
  {logs.length === 0 ? (
    <p>Không có log.</p>
  ) : (
    <div style={{ maxHeight: 500, overflowY: "auto" }}>
      {logs.map((log, idx) => (
        <div
          key={idx}
          style={{
            background: "#f9f9f9",
            padding: "16px 20px",
            borderLeft: "4px solid #1890ff",
            borderRadius: 6,
            marginBottom: 16,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <strong>Thời gian:</strong>{" "}
            <span style={{ color: "#555" }}>
              {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")}
            </span>
          </div>

          <div style={{ marginBottom: 6 }}>
            <strong>Loại hành động:</strong>{" "}
            <Tag color="blue" style={{ fontWeight: "bold" }}>{log.actionType}</Tag>
          </div>

          <div style={{ marginBottom: 6 }}>
            <strong>Người thực hiện:</strong>{" "}
            {log.actionBy?.name || "—"}{" "}
            <span style={{ color: "#888" }}>
              ({log.actionBy?.employeeCode || "—"})
            </span>
          </div>

          {log.description && (
            <div style={{ marginBottom: 6 }}>
              <strong>Ghi chú:</strong> {log.description}
            </div>
          )}

          {log.changes && (
            <div style={{ marginTop: 8 }}>
              <strong>Thay đổi:</strong>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                {Object.entries(log.changes).map(([field, val]) => {
                  if (field === "timeSlots") {
                    return (
                      <li key={field}>
                        <strong>{field}:</strong>
                        <ul>
                          {val.to.map((slot, idx) => (
                            <li key={idx}>
                              {dayjs(slot.startTime).format("HH:mm")} - {dayjs(slot.endTime).format("HH:mm")}{" "}
                              <Tag color={slot.status === "busy" ? "red" : "green"}>{slot.status}</Tag>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }

                  const isDate = (value) =>
                    typeof value === "string" && dayjs(value).isValid();
                  const formatValue = (value) => {
                    if (isDate(value)) return dayjs(value).format("YYYY-MM-DD");
                    if (typeof value === "object") return JSON.stringify(value);
                    return value;
                  };

                  return (
                    <li key={field}>
                      <strong>{field}:</strong> {formatValue(val.from)} →{" "}
                      <span style={{ color: "#1890ff" }}>{formatValue(val.to)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</Modal>



      <Modal
  title="Chi tiết nhân viên"
  open={detailModalVisible}
  onCancel={() => setDetailModalVisible(false)}
  footer={null}
>
  {selectedEmployee ? (
    <div>
      <p><strong>Tên:</strong> {selectedEmployee.name}</p>
      <p><strong>Email:</strong> {selectedEmployee.email}</p>
      <p><strong>Vai trò:</strong> {selectedEmployee.role}</p>
      <p><strong>Trạng thái:</strong> {selectedEmployee.status}</p>
      <p><strong>Khoa:</strong> {(() => {
        const dep = departments.find(d => d._id === selectedEmployee.department || d._id === selectedEmployee.department?._id);
        return dep?.name || 'Không rõ';
      })()}</p>
      <p><strong>Chuyên môn:</strong> {selectedEmployee.specialization}</p>
      <p><strong>Số điện thoại:</strong> {selectedEmployee.phone}</p>
    </div>
  ) : (
    <p>Đang tải thông tin...</p>
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
      <p><strong>Mô tả:</strong> {selectedDepartment.description || 'Không có mô tả'}</p>
      {selectedDepartment.image && (
        <img
          src={selectedDepartment.image}
          alt="Ảnh khoa"
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
        />
      )}
    </div>
  ) : (
    <p>Đang tải thông tin khoa...</p>
  )}
</Modal>


    </div>
  );
}

export default ReceptionistScheduleManager;