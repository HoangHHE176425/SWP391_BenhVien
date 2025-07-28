// pages/DoctorAttendance.jsx
import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Empty } from "antd";

const { Title, Text } = Typography;

const DoctorAttendance = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);

  const doctor = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    checkStatus();
  }, [doctor._id]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`http://localhost:9999/api/attendance/status/${doctor._id}`);
      const data = await res.json();

      if (data) {
        setHasCheckedIn(true);
        if (data.checkOutTime) {
          setHasCheckedOut(true);
        }
      }

      const attendanceRes = await fetch(`http://localhost:9999/api/attendance/history/${doctor._id}`);
      const attendanceData = await attendanceRes.json();
      setAttendanceData(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (err) {
      message.error("Failed to load attendance status");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      if (hasCheckedIn) {
        message.warning("You have already checked in today!");
        return;
      }

      const res = await fetch("http://localhost:9999/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: doctor._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Checked in successfully!");
      setHasCheckedIn(true);
      checkStatus();
    } catch (err) {
      message.error("Check-in failed: " + err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!hasCheckedIn) {
        message.warning("You must check in before checking out!");
        return;
      }

      if (hasCheckedOut) {
        message.warning("You have already checked out today!");
        return;
      }

      const res = await fetch("http://localhost:9999/api/attendance/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: doctor._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Checked out successfully!");
      setHasCheckedOut(true);
      checkStatus();
    } catch (err) {
      message.error("Check-out failed: " + err.message);
    }
  };

  const columns = [
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
      render: (text) => (text ? new Date(text).toLocaleString() : "N/A"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (text, record) => (record.checkOutTime ? "Chấm công" : "Điểm danh"),
    },
  ];

  if (loading) return <p>Loading...</p>;

  return (
    <Card style={{ maxWidth: 800, margin: "auto", marginTop: 50, textAlign: "center" }}>
      <Title level={3}>Điểm danh bác sĩ</Title>
      <Text strong>Bác sĩ: {doctor.name}</Text>
      <br /><br />
      <Button
        type="primary"
        onClick={handleCheckIn}
        disabled={hasCheckedIn}
      >
        Điểm danh
      </Button>
      <br /><br />
      <Button
        type="default"
        onClick={handleCheckOut}
        disabled={!hasCheckedIn || hasCheckedOut}
      >
        Chấm công
      </Button>
      <br /><br />
      <Title level={4}>Lịch sử điểm danh</Title>
      {attendanceData.length === 0 ? (
        <Empty description="Không tìm thấy lịch sử điểm danh" />
      ) : (
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="id" // đảm bảo mỗi record có id
        />
      )}
    </Card>
  );
};

export default DoctorAttendance;
