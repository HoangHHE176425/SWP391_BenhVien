import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Empty } from "antd";

const { Title, Text } = Typography;

const EmployeeAttendance = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const employee = JSON.parse(localStorage.getItem("user")); // Ensure employee._id exists

  useEffect(() => {
    checkStatus();
  }, [employee._id]);

  const checkStatus = async () => {
  try {
    const attendanceRes = await fetch(`http://localhost:9999/api/attendance/history/${employee._id}`);
    const attendanceData = await attendanceRes.json();
    const data = Array.isArray(attendanceData) ? attendanceData : [];
    setAttendanceData(data);

    // ✅ Tìm bản ghi mới nhất CHƯA CHECK-OUT
    const openRecord = data.find(record => !record.checkOutTime);

    if (openRecord) {
      setHasCheckedIn(true);
      setHasCheckedOut(false);
    } else {
      setHasCheckedIn(false);
      setHasCheckedOut(false);
    }
  } catch (err) {
    message.error("Failed to load attendance status");
  } finally {
    setLoading(false);
  }
};


const handleCheckIn = async () => {
  try {
    console.log("🔄 Attempting to check in...");

    // Kiểm tra employee object
    if (!employee || !employee._id) {
      console.error("❌ employee object is missing or invalid:", employee);
      message.error("Employee ID is missing");
      return;
    }

    console.log("📤 Sending employeeId:", employee._id);

    const res = await fetch("http://localhost:9999/api/attendance/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: employee._id }),
    });

    console.log("📥 Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Server error response:", errorData);
      throw new Error(errorData.message || "Unknown error");
    }

    const data = await res.json();
    console.log("✅ Check-in successful:", data);

    message.success("Checked in successfully!");
    setHasCheckedIn(true);
    setHasCheckedOut(false);
    checkStatus(); // Refresh attendance status
  } catch (err) {
    console.error("❌ Check-in failed:", err.message);
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
        message.warning("You have already checked out for this session!");
        return;
      }

      const res = await fetch("http://localhost:9999/api/attendance/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Checked out successfully!");
      setHasCheckedOut(true);
      checkStatus(); // Refresh the attendance history
    } catch (err) {
      message.error("Check-out failed: " + err.message);
    }
  };

  const columns = [
    {
      title: "Check-in Time",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Check-out Time",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      render: (text) => (text ? new Date(text).toLocaleString() : "N/A"),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, record) => (record.checkOutTime ? "Checked out" : "Checked in"),
    },
  ];

  if (loading) return <p>Loading...</p>;

  return (
    <Card style={{ maxWidth: 800, margin: "auto", marginTop: 50, textAlign: "center" }}>
      <Title level={3}>Điểm danh nhân viên</Title>
      <Text strong>Tên: {employee.name}</Text>
      <br /><br />
      <Button
        type="primary"
        onClick={handleCheckIn}
        disabled={hasCheckedIn && !hasCheckedOut} // Allow new check-in only after check-out
      >
        Check In
      </Button>
      <br /><br />
      <Button
        type="default"
        onClick={handleCheckOut}
        disabled={!hasCheckedIn || hasCheckedOut}
      >
        Check Out
      </Button>
      <br /><br />
      
      <Title level={4}>Lịch sử điểm danh</Title>
      {attendanceData.length === 0 ? (
        <Empty description="No attendance history found" />
      ) : (
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="_id" // Use _id as the unique key for each record
          pagination={{ pageSize: 10 }} // Add pagination for better UX
        />
      )}
    </Card>
  );
};

export default EmployeeAttendance;