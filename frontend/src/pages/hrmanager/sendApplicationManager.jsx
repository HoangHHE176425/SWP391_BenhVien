import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, Typography, Modal, message, Form, Input } from "antd";
import axios from "axios";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SendApplicationManager = () => {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [form] = Form.useForm();
  const [viewEmpModal, setViewEmpModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [viewDeptModal, setViewDeptModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewLogModal, setViewLogModal] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!user?._id || !token) {
      message.error("Không tìm thấy thông tin đăng nhập.");
      return;
    }

    const res = await axios.get(`/api/applications/received/${user._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data || [];

    // ✅ Sắp xếp đơn khẩn cấp lên đầu
    const sorted = [...data].sort((a, b) => {
      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (a.priority !== "urgent" && b.priority === "urgent") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt); // ưu tiên đơn mới hơn
    });

    setApplications(sorted);        // Cập nhật danh sách gốc
    setFiltered(sorted);           // Cập nhật danh sách đã lọc
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách đơn:", err);
    message.error("Lỗi khi tải danh sách đơn.");
  } finally {
    setLoading(false);
  }
};

  const handleViewEmployee = (employee) => {
    setSelectedEmp(employee);
    setViewEmpModal(true);
  };



  const fetchLogs = async (applicationId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`/api/applications/${applicationId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      setLogs(res.data || []);
      setViewLogModal(true);
    } catch (err) {
      console.error("❌ Lỗi khi lấy log:", err);
      message.error("Không thể lấy lịch sử log.");
    }
  };

  const handleFilterChange = (
  statusValue,
  dateValue = selectedDate,
  text = searchText,
  priorityValue = priorityFilter
) => {
  setStatusFilter(statusValue);
  setPriorityFilter(priorityValue);

  let filteredList = [...applications];

  if (statusValue !== "all") {
    filteredList = filteredList.filter((a) => a.status === statusValue);
  }

  if (priorityValue !== "all") {
    filteredList = filteredList.filter((a) => a.priority === priorityValue);
  }

  if (dateValue) {
    const targetDate = dayjs(dateValue).startOf("day");
    filteredList = filteredList.filter((a) =>
      dayjs(a.createdAt).isSame(targetDate, "day")
    );
  }

  if (text) {
    const lower = text.toLowerCase();
    filteredList = filteredList.filter((a) => {
      const code = a.sender?.employeeCode?.toLowerCase() || "";
      const name = a.sender?.name?.toLowerCase() || "";
      return code.includes(lower) || name.includes(lower);
    });
  }

  // Sắp xếp urgent lên đầu (nếu muốn)
  filteredList.sort((a, b) => {
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (a.priority !== "urgent" && b.priority === "urgent") return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  setFiltered(filteredList);
};






  const handleViewDepartment = (dept) => {
    setSelectedDept(dept);
    setViewDeptModal(true);
  };
  const handleView = (record) => {
    setSelectedApp(record);
    setViewModal(true);
    form.setFieldsValue({
      status: record.status,
      reply: record.reply || "",
    });
  };

  const handleUpdateStatus = async (values) => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token"); // 👈 lấy token từ localStorage

    await axios.put(
      `/api/applications/${selectedApp._id}`,
      {
        status: values.status,
        reply: values.reply,
        decisionAt: new Date(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 gửi token lên
        },
      }
    );

    message.success("Cập nhật trạng thái đơn thành công!");
    setViewModal(false);
    setSelectedApp(null);
    form.resetFields();
    await fetchApplications(); // refresh danh sách
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật đơn:", err);
    message.error("Cập nhật trạng thái đơn thất bại.");
  } finally {
    setLoading(false);
  }
};


  const columns = [
    {
      title: "Mã nhân viên",
      render: (_, record) => {
        const code = record.sender?.employeeCode || "N/A";
        return (
          <Button type="link" onClick={() => handleViewEmployee(record.sender)}>
            {code}
          </Button>
        );
      },
    },
    {
      title: "Phòng ban",
      render: (_, record) => {
        const department = record.sender?.department;
        const code = department?.departmentCode || "Không có";
        return (
          <Button type="link" onClick={() => handleViewDepartment(department)}>
            {code}
          </Button>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "subject",
    },
    {
      title: "Loại đơn",
      dataIndex: "templateType",
      render: (type) => type || "Khác",
    },
        {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const colorMap = {
          pending: "gold",
          approved: "green",
          rejected: "red",
          processing: "blue",
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Mức độ",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        if (priority === "urgent") {
          return <Tag color="red">Khẩn cấp</Tag>;
        }
        return <Tag color="blue">Bình thường</Tag>;
      },
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <>
          <Button size="small" onClick={() => handleView(record)} style={{ marginRight: 8 }}>
            Xem và xử lý
          </Button>
          <Button size="small" onClick={() => fetchLogs(record._id)} type="dashed">
            Xem log
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3}>Quản lý Đơn</Title>

      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Input.Search
        placeholder="Tìm theo mã hoặc tên nhân viên"
        allowClear
        value={searchText}
        onChange={(e) => {
          const value = e.target.value;
          setSearchText(value);
          handleFilterChange(statusFilter, selectedDate, value); // truyền luôn searchText
        }}
        style={{ width: 300 }}
      />
      <span>Mức độ:</span>
<Select
  value={priorityFilter}
  onChange={(value) => handleFilterChange(statusFilter, selectedDate, searchText, value)}
  style={{ width: 160 }}
>
  <Option value="all">Tất cả</Option>
  <Option value="urgent">Khẩn cấp</Option>
  <Option value="normal">Bình thường</Option>
</Select>

        <span>Trạng thái:</span>
        <Select
          value={statusFilter}
          onChange={(value) => handleFilterChange(value, selectedDate)}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="pending">Chờ duyệt</Option>
          <Option value="processing">Đang xử lý</Option>
          <Option value="approved">Đã duyệt</Option>
          <Option value="rejected">Từ chối</Option>
        </Select>
        <span>Chọn ngày:</span>
<DatePicker
  format="DD/MM/YYYY"
  value={selectedDate}
  onChange={(date) => {
    setSelectedDate(date);
    handleFilterChange(statusFilter, date); // cập nhật lọc theo ngày
  }}
  placeholder="Chọn ngày"
/>

      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Chưa có đơn nào." }}
      />

      <Modal
        open={viewModal}
        onCancel={() => {
          setViewModal(false);
          setSelectedApp(null);
          form.resetFields();
        }}
        title="Chi tiết và xử lý đơn"
        footer={null}
      >
        {selectedApp && (
          <div>
            <p>
              <strong>Mức độ ưu tiên:</strong>{" "}
              <Tag color={selectedApp.priority === "urgent" ? "red" : "blue"}>
                {selectedApp.priority === "urgent" ? "Khẩn cấp" : "Bình thường"}
              </Tag>
            </p>
            <p><strong>Người gửi:</strong> {selectedApp.sender?.name}</p>
            <p><strong>Phòng ban:</strong> {selectedApp.sender?.department?.name}</p>
            <p><strong>Loại đơn:</strong> {selectedApp.templateType || "Khác"}</p>
            <p><strong>Tiêu đề:</strong> {selectedApp.subject}</p>
            {selectedApp.fields?.length > 0 && (
              <>
                <p><strong>Thông tin bổ sung:</strong></p>
                {selectedApp.fields.map((field, index) => (
                  <p key={index} style={{ marginLeft: 16 }}>
                    - {field}
                  </p>
                ))}
              </>
            )}
            <p><strong>Nội dung:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: 10, borderRadius: 4 }}>
              {selectedApp.content}
            </pre>
            {selectedApp.details && (
              <>
                <p><strong>Chi tiết bổ sung:</strong></p>
                <pre style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 10, borderRadius: 4 }}>
                  {selectedApp.details}
                </pre>
              </>
            )}
            <p><strong>Phản hồi hiện tại:</strong> {selectedApp.reply || "Chưa có phản hồi"}</p>

            <Form
              form={form}
              onFinish={handleUpdateStatus}
              layout="vertical"
              style={{ marginTop: 16 }}
            >
              <Form.Item
                name="status"
                label="Cập nhật trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
              >
                <Select>
                  <Option value="pending">Chờ duyệt</Option>
                  <Option value="processing">Đang xử lý</Option>
                  <Option value="approved">Đã duyệt</Option>
                  <Option value="rejected">Từ chối</Option>
                </Select>
              </Form.Item>
              <Form.Item name="reply" label="Phản hồi">
                <TextArea rows={4} placeholder="Nhập phản hồi (nếu có)" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
  open={viewEmpModal}
  onCancel={() => {
    setViewEmpModal(false);
    setSelectedEmp(null);
  }}
  title="Chi tiết nhân viên"
  footer={null}
>
  {selectedEmp && (
    <div style={{ lineHeight: 1.8 }}>
      <p><strong>Tên:</strong> {selectedEmp.name}</p>
      <p><strong>Email:</strong> {selectedEmp.email || "Chưa có"}</p>
      <p><strong>Vai trò:</strong> {selectedEmp.role}</p>
      <p><strong>Trạng thái:</strong> {selectedEmp.status}</p>
      <p><strong>Khoa:</strong> {selectedEmp.department?.name || "Chưa rõ"}</p>
      <p><strong>Chuyên môn:</strong> {selectedEmp.specialization || "Không có"}</p>
      <p><strong>Số điện thoại:</strong> {selectedEmp.phone || "Không có"}</p>
    </div>
  )}
</Modal>
<Modal
  open={viewDeptModal}
  onCancel={() => {
    setViewDeptModal(false);
    setSelectedDept(null);
  }}
  title="Chi tiết khoa"
  footer={null}
>
  {selectedDept && (
    <div style={{ lineHeight: 1.8 }}>
      <p><strong>Tên khoa:</strong> {selectedDept.name}</p>
      <p><strong>Mã khoa:</strong> {selectedDept.departmentCode}</p>
      <p><strong>Mô tả:</strong> {selectedDept.description || "Không có mô tả"}</p>
      <p><strong>Trạng thái:</strong> {selectedDept.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}</p>
      {selectedDept.image && (
        <img
          src={selectedDept.image}
          alt="Ảnh khoa"
          style={{ width: "100%", maxWidth: 300, marginTop: 10, borderRadius: 8 }}
        />
      )}
    </div>
  )}
</Modal>

<Modal
  open={viewLogModal}
  onCancel={() => {
    setViewLogModal(false);
    setLogs([]);
  }}
  title="Lịch sử xử lý đơn"
  footer={null}
>
  {logs.length === 0 ? (
    <p>Chưa có log nào.</p>
  ) : (
    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
      {logs.map((log, index) => (
        <div
          key={log._id}
          style={{
            borderLeft: "4px solid #1890ff",
            padding: "12px 16px",
            marginBottom: 16,
            background: "#f9f9f9",
            borderRadius: 6,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: 4 }}>
            #{logs.length - index} • {log.action.toUpperCase()}
          </p>
          <p>
            <strong>Người thực hiện:</strong> {log.employee?.name || "Không rõ"}
          </p>
          <p>
            <strong>Mã NV:</strong> {log.employee?.employeeCode || "N/A"}
            &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            <strong>Vai trò:</strong> {log.employee?.role || "?"}
          </p>

          <p>
            <strong>Thời gian:</strong>{" "}
            {new Date(log.createdAt).toLocaleString("vi-VN")}
          </p>
          {log.note && (
            <p>
              <strong>Ghi chú:</strong> {log.note}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</Modal>



    </div>
  );
};

export default SendApplicationManager;