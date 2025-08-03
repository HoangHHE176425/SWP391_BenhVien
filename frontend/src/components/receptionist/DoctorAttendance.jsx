import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Tag } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
const { Title, Text } = Typography;
const DoctorAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (doctor?._id) {
      fetchAllSchedules();
      fetchAttendanceHistory();
    }
  }, [doctor?._id]);

  const fetchAllSchedules = async () => {
    try {
      const res = await fetch(`http://localhost:9999/api/attendance/doctor/schedules/all/${doctor._id}`)
      const data = await res.json();
      setAllSchedules(Array.isArray(data.schedules) ? data.schedules : []);
    } catch (err) {
      console.error("Lỗi fetch lịch làm việc:", err);
      message.error("Lỗi khi tải lịch làm việc");
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:9999/api/attendance/doctor/history/${doctor._id}`)
      const data = await res.json();
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error("Không thể tải lịch sử điểm danh");
    } finally {
      setLoading(false);
    }
  };

  const getIPAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch (err) {
      return "unknown";
    }
  };

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });

  const handleCheckInBySchedule = async (schedule) => {
  try {
    const ipAddress = await getIPAddress();
    const location = await getLocation();

    const res = await fetch("http://localhost:9999/api/attendance/doctor/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: doctor._id,
        scheduleId: schedule._id,
        date: schedule.date,
        timeSlots: schedule.timeSlots,
        department: schedule.department?._id || schedule.department,
        ipAddress,
        location,
      }),
    });

    if (!res.ok) throw new Error((await res.json()).message);
    message.success("Check-in thành công");
    fetchAttendanceHistory();
  } catch (err) {
    message.error("Check-in thất bại: " + err.message);
  }
};




  const handleCheckOutBySchedule = async (schedule) => {
    try {
      const res = await fetch("http://localhost:9999/api/attendance/doctor/check-out", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: doctor._id,
          scheduleId: schedule._id,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Lỗi không xác định");

      message.success("Check-out thành công");
      fetchAttendanceHistory();
    } catch (err) {
      message.error("Check-out thất bại: " + err.message);
    }
  };

  const getStatusTag = (status) => {
  const map = {
    Present: { color: "green", label: "Hoàn thành" },
    "Late-Arrival": { color: "gold", label: "Đến muộn" },
    "Left-Early": { color: "green", label: "Hoàn thành" },
    "Left-Late": { color: "orange", label: "Check-out muộn" },
    "Checked-In": { color: "processing", label: "Đang làm" },
    Absent: { color: "red", label: "Vắng mặt" }, 
    "On-Leave": { color: "cyan", label: "Nghỉ phép" },
    Invalid: { color: "default", label: "Không hợp lệ" },
  };
      const tag = map[status] || { color: "default", label: status || "--" };
    return <Tag color={tag.color}>{tag.label}</Tag>;
  };

  const today = new Date().toISOString().split("T")[0];
const todaySchedules = allSchedules
  .filter(schedule => dayjs(schedule.date).isSame(dayjs(), 'day'))
  .sort((a, b) => {
    const aStart = a.timeSlots?.[0]?.startTime ? new Date(a.timeSlots[0].startTime).getTime() : 0;
    const bStart = b.timeSlots?.[0]?.startTime ? new Date(b.timeSlots[0].startTime).getTime() : 0;
    return aStart - bStart;
  });



  const scheduleColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      render: (text) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: "Phòng ban",
      dataIndex: ["department", "name"],
      render: (text) => text || "Không rõ",
    },
    {
      title: "Khung Giờ",
      dataIndex: "timeSlots",
      render: (slots) =>
        slots.map((slot, i) => (
          <div key={i}>
            {dayjs(slot.startTime).format("HH:mm")} - {dayjs(slot.endTime).format("HH:mm")}
          </div>
        )),
    },
    {
      title: "Check-in",
      render: (record) => {
        const matched = attendanceData.find(a => a.scheduleId === record._id && a.checkInTime);
        return matched ? dayjs(matched.checkInTime).format("HH:mm:ss") : <Tag color="default">--</Tag>;
      },
    },
    {
      title: "Check-out",
      render: (record) => {
        const matched = attendanceData.find(a => a.scheduleId === record._id && a.checkOutTime);
        return matched ? dayjs(matched.checkOutTime).format("HH:mm:ss") : <Tag color="default">--</Tag>;
      },
    },
    {
      title: "Trạng thái",
      render: (record) => {
        const matched = attendanceData.find(a => a.scheduleId === record._id);
        return matched ? getStatusTag(matched.status) : <Tag color="red">Chưa điểm danh</Tag>;
      },
    },
    {
      title: "Hành động",
      render: (schedule) => {
        const matched = attendanceData.find(a => a.scheduleId === schedule._id);
        const isCheckedIn = !!matched?.checkInTime;
        const isCheckedOut = !!matched?.checkOutTime;
        const isOnLeave = matched?.status === "On-Leave";

        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="small"
              type="primary"
              disabled={isCheckedIn || isOnLeave}
              onClick={() => handleCheckInBySchedule(schedule)}
            >
              Check-In
            </Button>
            <Button
              size="small"
              disabled={!isCheckedIn || isCheckedOut}
              onClick={() => handleCheckOutBySchedule(schedule)}
            >
              Check-Out
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Card style={{ maxWidth: 1000, margin: "auto", marginTop: 50 }}>
      <Title level={3}>Điểm danh bác sĩ</Title>
      <Text strong>Bác sĩ: {doctor.name}</Text>
      <br /><br />
      <Title level={4}>Lịch làm việc hôm nay</Title>

      <Table
        rowKey="_id"
        columns={scheduleColumns}
        dataSource={todaySchedules}
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "Không có lịch làm việc hôm nay" }}
      />
    </Card>
  );
};

export default DoctorAttendance;
