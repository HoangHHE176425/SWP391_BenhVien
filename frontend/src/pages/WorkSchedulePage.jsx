import { useEffect, useState } from "react"
import { Table, Typography, Tag, Card, message, DatePicker, Select, Space } from "antd"
import dayjs from "dayjs"

const { Title } = Typography
const { Option } = Select

const WorkSchedulePage = () => {
  const [schedules, setSchedules] = useState([])
  const [filteredSchedules, setFilteredSchedules] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"))
        const doctorId = user?._id
        if (!doctorId) return message.error("Không tìm thấy doctorId")

        const resp = await fetch(`http://localhost:9999/api/work-schedule/doctor/${doctorId}`)
        const respJson = await resp.json()
        const schedules = respJson.schedules || []
        const attendances = respJson.attendance || []

        // Gắn attendance vào từng schedule theo scheduleId
        const enriched = schedules.map(schedule => {
          const att = attendances.find(a => a.scheduleId === schedule._id)
          return { ...schedule, attendance: att || null }
        })

        // Sắp xếp theo ngày tăng dần + giờ bắt đầu đầu tiên
        enriched.sort((a, b) => {
          const dateA = dayjs(a.date).valueOf()
          const dateB = dayjs(b.date).valueOf()
          if (dateA === dateB) {
            const aStart = a.timeSlots?.[0]?.startTime ? dayjs(a.timeSlots[0].startTime).valueOf() : 0
            const bStart = b.timeSlots?.[0]?.startTime ? dayjs(b.timeSlots[0].startTime).valueOf() : 0
            return aStart - bStart
          }
          return dateA - dateB
        })

        setSchedules(enriched)
        setFilteredSchedules(enriched)
      } catch (err) {
        console.error(err)
        message.error("Lỗi khi fetch lịch làm việc")
        setSchedules([])
        setFilteredSchedules([])
      }
    }

    fetchData()
  }, [])

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY")
  const formatTime = (time) => dayjs(time).format("HH:mm")

  const getAttendanceTag = (status) => {
    const map = {
      Present: { color: "green", label: "Hoàn thành" },
      "Late-Arrival": { color: "gold", label: "Đến muộn" },
      "Left-Early": { color: "blue", label: "Về sớm" },
      "Left-Late": { color: "orange", label: "Check-out muộn" },
      "Checked-In": { color: "processing", label: "Đang làm" },
      Absent: { color: "red", label: "Vắng mặt" },
      "On-Leave": { color: "cyan", label: "Nghỉ phép" },
      Invalid: { color: "default", label: "Không hợp lệ" },
    }

    const tag = map[status] || { color: "default", label: "Chưa điểm danh" }
    return <Tag color={tag.color}>{tag.label}</Tag>
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "green"
      case "Booked": return "orange"
      case "Unavailable": return "red"
      default: return "default"
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date);
    applyFilters(date, selectedStatus, selectedAttendanceStatus);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(selectedDate, status, selectedAttendanceStatus);
  };

  const applyFilters = (date, status, attendanceStatus) => {
  let result = [...schedules];

  if (date) {
    const targetDate = date.startOf("day");
    result = result.filter((item) =>
      dayjs(item.date).isSame(targetDate, "day")
    );
  }

  if (status) {
    result = result.filter((item) =>
      item.timeSlots.some((slot) => slot.status === status)
    );
  }

  if (attendanceStatus) {
    result = result.filter((item) =>
      item.attendance?.status === attendanceStatus
    );
  }

  setFilteredSchedules(result);
};


  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (text) => formatDate(text),
    },
    {
      title: "Phòng ban",
      dataIndex: "departmentName",
      key: "departmentName",
    },
    {
      title: "Khung Giờ & Trạng thái",
      dataIndex: "timeSlots",
      key: "timeSlots",
      render: (slots) => (
        <>
          {slots.map((slot, index) => (
            <div key={index}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}{" "}
              <Tag color={getStatusColor(slot.status)}>{slot.status}</Tag>
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Điểm danh",
      dataIndex: "attendance",
      key: "attendance",
      render: (attendance) => getAttendanceTag(attendance?.status),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Lịch Làm Việc</Title>

      {/* Bộ lọc */}
      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          placeholder="Chọn ngày"
          value={selectedDate}
          onChange={handleDateChange}
          allowClear
          format="DD/MM/YYYY"
        />
        <Select
          placeholder="Chọn trạng thái"
          value={selectedStatus}
          onChange={handleStatusChange}
          allowClear
          style={{ width: 160 }}
        >
          <Option value="Available">Available</Option>
          <Option value="Booked">Booked</Option>
        </Select>
      </Space>
<Select
  placeholder="Lọc theo điểm danh"
  value={selectedAttendanceStatus}
  onChange={(val) => {
    setSelectedAttendanceStatus(val);
    applyFilters(selectedDate, selectedStatus, val);
  }}
  allowClear
  style={{ width: 200 }}
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

      <Card variant="outlined">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredSchedules}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}

export default WorkSchedulePage
