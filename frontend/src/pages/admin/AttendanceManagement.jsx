// AttendanceManagement.jsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  Modal,
  message,
  Tag,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import AttendConfigModal from "./AttendConfigModal";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AttendanceManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeName: "",
    status: "",
    dates: [],
  });
  const [editingNote, setEditingNote] = useState(null);
  const [noteModal, setNoteModal] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState("08:00");
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await axios.get("/api/admin/attend-config");
      setDeadlineTime(res.data.data.checkInDeadline || "08:00");
    } catch (err) {
      message.warning("Failed to load check-in deadline config.");
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.dates.length === 2) {
        params.startDate = filters.dates[0].format("YYYY-MM-DD");
        params.endDate = filters.dates[1].format("YYYY-MM-DD");
      }
      const res = await axios.get("/api/admin/attend", { params });
      let data = res.data.data;

      if (filters.employeeName) {
        data = data.filter((rec) =>
          rec.employeeId?.name
            ?.toLowerCase()
            .includes(filters.employeeName.toLowerCase())
        );
      }
      setRecords(data);
    } catch (err) {
      message.error("Failed to fetch attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAttendance();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const resetFilters = () => {
    setFilters({ employeeName: "", status: "", dates: [] });
  };

  const calculateLateMinutes = (checkInTime, date) => {
    const checkIn = dayjs(checkInTime);
    const deadline = dayjs(
      `${dayjs(date).format("YYYY-MM-DD")}T${deadlineTime}`
    );
    return checkIn.isAfter(deadline) ? checkIn.diff(deadline, "minute") : 0;
  };

  const columns = [
    {
      title: "Nhân Viên",
      dataIndex: ["employeeId", "name"],
    },
    {
      title: "Email",
      dataIndex: ["employeeId", "email"],
    },
    {
      title: "Ngày",
      dataIndex: "date",
      render: (val) => dayjs(val).format("DD-MM-YYYY"),
    },
    {
      title: "Giờ Check-In",
      dataIndex: "checkInTime",
      render: (val) => (val ? dayjs(val).format("HH:mm:ss") : "Không có"),
    },
    {
      title: "Đi trễ",
      render: (_, record) => {
        const mins = calculateLateMinutes(record.checkInTime, record.date);
        if (mins <= 0) return "-";
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      },
    },
    {
      title: "Giờ Check-Out",
      dataIndex: "checkOutTime",
      render: (val) => (val ? dayjs(val).format("HH:mm:ss") : "Không có"),
    },
    {
      title: "Thời Gian Làm Việc",
      dataIndex: "workingDuration",
      render: (val) => val || "-",
    },
    {
      title: "Trạng Thái",
      render: (_, record) => {
        if (!record.checkInTime) {
          const deadline = dayjs(record.date)
            .hour(deadlineHour)
            .minute(deadlineMinute);
          return dayjs().isAfter(deadline) ? (
            <Tag color="red">Vắng mặt</Tag>
          ) : (
            <Tag color="orange">Chưa điểm danh</Tag>
          );
        }
        return <Tag color="green">Có mặt</Tag>;
      },
    },
    {
      title: "Ghi Chú",
      dataIndex: "notes",
    },
    {
      title: "Thao Tác",
      render: (_, record) => (
        <Button
          onClick={() => {
            setEditingNote(record);
            setNoteModal(true);
          }}
        >
          Chỉnh Sửa Ghi Chú
        </Button>
      ),
    },
  ];

  const handleNoteUpdate = async () => {
    try {
      await axios.put(`/api/admin/attend/note/${editingNote._id}`, {
        note: editingNote.notes,
      });
      message.success("Note updated");
      setNoteModal(false);
      fetchAttendance();
    } catch (err) {
      message.error("Failed to update note");
    }
  };
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Quản Lý Điểm Danh</h2>
      <div className="flex gap-4 mb-4 flex-wrap">
        <Input
          placeholder="Tìm theo tên nhân viên"
          value={filters.employeeName}
          onChange={(e) =>
            setFilters({ ...filters, employeeName: e.target.value })
          }
        />
        <Select
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val })}
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
        >
          <Option value="Present">Có mặt</Option>
          <Option value="Absent">Vắng mặt</Option>
        </Select>
        <RangePicker
          value={filters.dates}
          onChange={(dates) => setFilters({ ...filters, dates })}
          format="DD/MM/YYYY"
          placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
        />
        {/* <Button onClick={() => setConfigModalOpen(true)}>
          Chỉnh sửa thời gian điểm danh
        </Button> */}
        <Button danger onClick={resetFilters}>
          Đặt lại bộ lọc
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Chỉnh Sửa Ghi Chú"
        open={noteModal}
        onOk={handleNoteUpdate}
        onCancel={() => setNoteModal(false)}
      >
        <Input.TextArea
          rows={4}
          value={editingNote?.notes}
          onChange={(e) =>
            setEditingNote({ ...editingNote, notes: e.target.value })
          }
        />
      </Modal>
      <AttendConfigModal
        open={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          fetchConfig();
          fetchAttendance();
        }}
      />
    </div>
  );
};

export default AttendanceManagement;
