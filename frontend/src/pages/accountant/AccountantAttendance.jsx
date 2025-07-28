import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Empty } from "antd";

const { Title, Text } = Typography;

const AccountantAttendance = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);

  const employee = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (employee?._id) {
      checkStatus();
    }
  }, [employee?._id]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`http://localhost:9999/api/attendance/status/${employee._id}`);
      const data = await res.json();

      if (data) {
        setHasCheckedIn(true);
        if (data.checkOutTime) {
          setHasCheckedOut(true);
        }
      }

      const attendanceRes = await fetch(`http://localhost:9999/api/attendance/history/${employee._id}`);
      const historyData = await attendanceRes.json();
      setAttendanceData(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      message.error("Không thể tải trạng thái điểm danh.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn) {
      message.warning("Bạn đã điểm danh (check-in) hôm nay!");
      return;
    }

    try {
      const res = await fetch("http://localhost:9999/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Điểm danh (check-in) thành công!");
      setHasCheckedIn(true);
      checkStatus();
    } catch (err) {
      message.error("Điểm danh thất bại: " + err.message);
    }
  };

  const handleCheckOut = async () => {
    if (!hasCheckedIn) {
      message.warning("Bạn cần check-in trước khi check-out!");
      return;
    }

    if (hasCheckedOut) {
      message.warning("Bạn đã check-out rồi!");
      return;
    }

    try {
      const res = await fetch("http://localhost:9999/api/attendance/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Check-out thành công!");
      setHasCheckedOut(true);
      checkStatus();
    } catch (err) {
      message.error("Check-out thất bại: " + err.message);
    }
  };

  const columns = [
    {
      title: "Thời gian Check-in",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Thời gian Check-out",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      render: (text) => (text ? new Date(text).toLocaleString() : "Chưa check-out"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (text) => (text ? "Đã check-out" : "Đã check-in"),
    },
  ];

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <Card style={{ maxWidth: 800, margin: "auto", marginTop: 50, textAlign: "center" }}>
      <Title level={3}>Điểm danh - Nhân viên Kế toán</Title>
      <Text strong>Họ tên: {employee.name}</Text>
      <br /><br />

      <Button type="primary" onClick={handleCheckIn} disabled={hasCheckedIn}>
        Check In
      </Button>
      <br /><br />
      <Button type="default" onClick={handleCheckOut} disabled={!hasCheckedIn || hasCheckedOut}>
        Check Out
      </Button>
      <br /><br />

      <Title level={4}>Lịch sử điểm danh</Title>
      {attendanceData.length === 0 ? (
        <Empty description="Chưa có lịch sử điểm danh" />
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

export default AccountantAttendance;
