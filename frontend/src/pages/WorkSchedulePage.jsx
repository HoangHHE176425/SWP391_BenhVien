import { useEffect, useState } from "react"
import { Table, Typography, Tag, Card, message } from "antd"
import dayjs from "dayjs"

const { Title } = Typography

const WorkSchedulePage = () => {
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"))
        const doctorId = user?._id
        if (!doctorId) return message.error("Không tìm thấy doctorId")

        const resp = await fetch(`http://localhost:9999/api/work-schedule/doctor/${doctorId}`)
        const respJson = await resp.json()
        setSchedules(respJson.data)
      } catch (err) {
        message.error("Lỗi khi fetch lịch")
        setSchedules([])
      }
    }
    fetchData()
  }, [])

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY")
  const formatTime = (time) => dayjs(time).format("HH:mm")

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
      key: "department",
    },
    {
      title: "Khung Giờ",
      dataIndex: "timeSlots",
      key: "timeSlots",
      render: (slots) => (
        <>
          {slots.map((slot, index) => (
            <div key={index}>
              ⏰ {formatTime(slot.startTime)} - {formatTime(slot.endTime)}{" "}
              <Tag color={getStatusColor(slot.status)}>{slot.status}</Tag>
            </div>
          ))}
        </>
      ),
    },
  ]

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

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Lịch Làm Việc</Title>
      <Card bordered>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={schedules}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}

export default WorkSchedulePage
