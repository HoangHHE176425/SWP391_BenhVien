import { useEffect, useState } from "react";
import { Button, Card, Typography, message, Table, Empty } from "antd"; // Đã thêm Empty để hiển thị khi không có dữ liệu

const { Title, Text } = Typography;

const EmployeeAttendance = () => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]); // Để lưu trữ dữ liệu chấm công

  const employee = JSON.parse(localStorage.getItem("user")); // Ensure employee._id exists

  useEffect(() => {
    checkStatus(); // Gọi checkStatus khi component được render lần đầu tiên để tải dữ liệu
  }, [employee._id]);

  // Hàm để tải lại dữ liệu chấm công từ server
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

      // Lấy tất cả dữ liệu chấm công của nhân viên
      const attendanceRes = await fetch(`http://localhost:9999/api/attendance/history/${employee._id}`);
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
      // Kiểm tra nếu nhân viên đã check-in trong ngày
      if (hasCheckedIn) {
        message.warning("You have already checked in today!");
        return;
      }

      const res = await fetch("http://localhost:9999/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Checked in successfully!");
      setHasCheckedIn(true);

      // Gọi lại checkStatus để làm mới bảng sau khi check-in thành công
      checkStatus(); 
    } catch (err) {
      message.error("Check-in failed: " + err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      // Kiểm tra nếu nhân viên chưa check-in hoặc đã check-out rồi
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
        body: JSON.stringify({ employeeId: employee._id }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      message.success("Checked out successfully!");
      setHasCheckedOut(true);

      // Gọi lại checkStatus để làm mới bảng sau khi check-out thành công
      checkStatus(); 
    } catch (err) {
      message.error("Check-out failed: " + err.message);
    }
  };

  const columns = [
    {
      title: "Check-in Time",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (text) => new Date(text).toLocaleString(), // Định dạng lại thời gian check-in
    },
    {
      title: "Check-out Time",
      dataIndex: "checkOutTime",
      key: "checkOutTime",
      render: (text) => (text ? new Date(text).toLocaleString() : "N/A"), // Định dạng lại thời gian check-out, nếu chưa có thì hiển thị "N/A"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => (text ? "Checked out" : "Checked in"),
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
        disabled={hasCheckedIn}
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
        <Empty description="No attendance history found" /> // Hiển thị khi không có dữ liệu
      ) : (
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="id" // assuming each attendance record has a unique "id"
        />
      )}
    </Card>
  );
};

export default EmployeeAttendance;
