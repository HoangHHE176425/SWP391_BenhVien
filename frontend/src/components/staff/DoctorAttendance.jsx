import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Empty, Tag } from "antd";

const { Title, Text } = Typography;

const DoctorAttendance = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentSlotInfo, setCurrentSlotInfo] = useState({ slot: "", type: "" });

  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (doctor?._id) {
      const info = getSlotInfo();
      setCurrentSlotInfo(info);
      checkStatus();
    }
  }, [doctor?._id]);

  const getSlotInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { type: "Regular", slot: "Morning" };
    if (hour >= 12 && hour < 18) return { type: "Regular", slot: "Afternoon" };
    return { type: "Overtime", slot: "Evening" };
  };

  const checkStatus = async () => {
    try {
      setLoading(true);

      const attendanceRes = await fetch(`http://localhost:9999/api/attendance/history/${doctor._id}`);
      const attendance = await attendanceRes.json();

      const validHistory = Array.isArray(attendance) ? attendance : [];
      setAttendanceData(validHistory);

      const latest = validHistory.find((item) => item.checkInTime && !item.checkOutTime);
      setHasCheckedIn(!!latest);
      setHasCheckedOut(!latest);
    } catch (err) {
      console.error("❌ checkStatus error:", err);
      message.error("Không thể tải lịch sử điểm danh");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: doctor._id,
          ...currentSlotInfo,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Check-in thành công");
      checkStatus();
    } catch (err) {
      message.error("❌ Check-in thất bại: " + err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/attendance/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: doctor._id,
          ...currentSlotInfo,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Check-out thành công");
      checkStatus();
    } catch (err) {
      message.error("❌ Check-out thất bại: " + err.message);
    }
  };

  const columns = [
    {
      title: "Ca",
      dataIndex: "slot",
      key: "slot",
      render: (text) => text || "Không rõ",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (text) =>
        text === "Overtime" ? <Tag color="volcano">Tăng ca</Tag> : <Tag color="blue">Ca chính</Tag>,
    },
    {
      title: "Giờ vào",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Giờ ra",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      render: (text) => (text ? new Date(text).toLocaleString() : "Chưa chấm công"),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) =>
        record.checkOutTime ? (
          <Tag color="green">Hoàn thành</Tag>
        ) : (
          <Tag color="orange">Đang làm</Tag>
        ),
    },
  ];

  if (loading) return <p style={{ textAlign: "center" }}>Đang tải dữ liệu...</p>;

  return (
    <Card style={{ maxWidth: 900, margin: "auto", marginTop: 50, textAlign: "center" }}>
      <Title level={3}>Điểm danh bác sĩ</Title>
      <Text strong>Bác sĩ: {doctor.name}</Text>
      <br />
      <Text type="secondary">
        Ca hiện tại: <b>{currentSlotInfo.slot}</b> - {currentSlotInfo.type === "Overtime" ? "Tăng ca" : "Ca chính"}
      </Text>

      <br /><br />
      <Button
        type="primary"
        onClick={handleCheckIn}
        disabled={hasCheckedIn}
        style={{ marginRight: 10 }}
      >
        Check-In
      </Button>

      <Button
        type="default"
        onClick={handleCheckOut}
        disabled={!hasCheckedIn || hasCheckedOut}
      >
        Check-Out
      </Button>

      <br /><br />
      <Title level={4}>Lịch sử điểm danh</Title>
      {attendanceData.length === 0 ? (
        <Empty description="Không tìm thấy lịch sử điểm danh" />
      ) : (
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
        />
      )}
    </Card>
  );
};

export default DoctorAttendance;
