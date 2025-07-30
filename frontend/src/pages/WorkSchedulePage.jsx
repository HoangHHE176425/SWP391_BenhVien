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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"))
        const doctorId = user?._id
        if (!doctorId) return message.error("Không tìm thấy doctorId")

        const resp = await fetch(`http://localhost:9999/api/work-schedule/doctor/${doctorId}`)
        const respJson = await resp.json()
        const data = respJson.data || []
        setSchedules(data)
        setFilteredSchedules(data)
      } catch (err) {
        message.error("Lỗi khi fetch lịch")
        setSchedules([])
        setFilteredSchedules([])
      }
    }

    fetchData()
  }, [])

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY")
  const formatTime = (time) => dayjs(time).format("HH:mm")

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "green"
      case "Booked":
        return "orange"
      case "Unavailable":
        return "red"
      default:
        return "default"
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    applyFilters(date, selectedStatus)
  }

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    applyFilters(selectedDate, status)
  }

  const applyFilters = (date, status) => {
    let result = [...schedules]

    if (date) {
      const targetDate = date.startOf("day")
      result = result.filter((item) =>
        dayjs(item.date).isSame(targetDate, "day")
      )
    }

    if (status) {
      result = result.filter((item) =>
        item.timeSlots.some((slot) => slot.status === status)
      )
    }

    setFilteredSchedules(result)
  }

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
      title: "Khung Giờ",
      dataIndex: "timeSlots",
      key: "timeSlots",
      render: (slots) => (
        <>
          {slots.map((slot, index) => (
            <div key={index}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "timeSlots",
      key: "status",
      render: (slots) => (
        <>
          {slots.map((slot, index) => (
            <div key={index}>
              <Tag color={getStatusColor(slot.status)}>{slot.status}</Tag>
            </div>
          ))}
        </>
      ),
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

      <Card bordered>
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
