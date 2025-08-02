import React, { useEffect, useState } from "react";
import { Button, Input, Select, message, Typography, Card, Table, Tag } from "antd";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

const templates = {
  leave: {
    subject: "Đơn xin nghỉ phép",
    fields: [
      { label: "Ngày bắt đầu", placeholder: "VD: 01/01/2025" },
      { label: "Ngày kết thúc", placeholder: "VD: 05/01/2025" },
      { label: "Lý do", placeholder: "VD: Lý do cá nhân" },
    ],
    content: (name, dept, values) => `Kính gửi Phòng Nhân sự,

Tôi là ${name}, công tác tại ${dept}. Nay tôi làm đơn này xin được nghỉ phép từ ngày ${values[0] || "___"} đến ngày ${values[1] || "___"} vì lý do ${values[2] || "_______________"}.

Trong thời gian nghỉ, tôi cam kết bàn giao công việc đầy đủ và sẽ quay lại làm việc đúng thời gian quy định.

Trân trọng,
${name}`,
  },
  "urgent-leave": {
    subject: "Đơn xin nghỉ đột xuất",
    fields: [
      { label: "Ngày bắt đầu", placeholder: "VD: 01/01/2025" },
      { label: "Ngày kết thúc", placeholder: "VD: 05/01/2025" },
      { label: "Lý do", placeholder: "VD: Tình huống khẩn cấp" },
    ],
    content: (name, dept, values) => `Kính gửi Phòng Nhân sự,

Tôi là ${name}, hiện đang công tác tại ${dept}. Do tình huống đột xuất, tôi làm đơn này xin phép được nghỉ làm từ ngày ${values[0] || "___"} đến ngày ${values[1] || "___"} với lý do ${values[2] || "_______________"}.

Tôi sẽ sắp xếp công việc và liên hệ người hỗ trợ nếu cần thiết.

Trân trọng,
${name}`,
  },
  "shift-change": {
    subject: "Đơn xin đổi ca trực",
    fields: [
      { label: "Ca hiện tại", placeholder: "VD: Ca sáng 7h-15h" },
      { label: "Ca muốn đổi", placeholder: "VD: Ca tối 15h-23h" },
      { label: "Người đồng ý đổi", placeholder: "VD: Nguyễn Văn A (nếu có)" },
    ],
    content: (name, dept, values) => `Kính gửi Trưởng khoa và Phòng Nhân sự,

Tôi là ${name}, công tác tại ${dept}. Do lý do cá nhân, tôi xin được đổi ca trực như sau:

- Ca hiện tại: ${values[0] || "___________"}
- Muốn đổi sang: ${values[1] || "___________"}
- Người đồng ý đổi (nếu có): ${values[2] || "___________"}

Tôi cam kết đảm bảo công việc chuyên môn.

Trân trọng,
${name}`,
  },
  overtime: {
    subject: "Đơn xin tăng ca",
    fields: [
      { label: "Thời gian bắt đầu", placeholder: "VD: 17h ngày 01/01/2025" },
      { label: "Thời gian kết thúc", placeholder: "VD: 20h ngày 01/01/2025" },
      { label: "Công việc", placeholder: "VD: Hoàn thành báo cáo" },
    ],
    content: (name, dept, values) => `Kính gửi Trưởng khoa và Phòng Nhân sự,

Tôi là ${name}, hiện đang làm việc tại ${dept}. Tôi xin được tăng ca:

- Thời gian: từ ${values[0] || "___"} đến ${values[1] || "___"} ngày ${values[1]?.split(" ")[2] || "___"}
- Công việc: ${values[2] || "__________________________________"}

Kính mong Quý phòng phê duyệt.

Trân trọng,
${name}`,
  },
  "equipment-request": {
    subject: "Đơn đề nghị cấp vật tư y tế",
    fields: [
      { label: "Tên thiết bị/vật tư", placeholder: "VD: Khẩu trang y tế" },
      { label: "Số lượng", placeholder: "VD: 100 cái" },
      { label: "Mục đích sử dụng", placeholder: "VD: Dùng cho phòng mổ" },
    ],
    content: (name, dept, values) => `Kính gửi Ban Giám đốc và Phòng Vật tư,

Tôi là ${name}, thuộc ${dept}. Hiện đơn vị đang thiếu vật tư thiết yếu. Tôi xin đề nghị được cấp:

- Tên thiết bị/vật tư: ${values[0] || "__________"}
- Số lượng: ${values[1] || "__________"}
- Mục đích sử dụng: ${values[2] || "__________"}

Kính mong được hỗ trợ kịp thời.

Trân trọng,
${name}`,
  },
  "medical-suggestion": {
    subject: "Đơn đề xuất chuyên môn",
    fields: [
      { label: "Nội dung đề xuất", placeholder: "VD: Cải tiến quy trình khám bệnh" },
      { label: "Lý do/hiệu quả", placeholder: "VD: Tăng hiệu suất khám bệnh" },
    ],
    content: (name, dept, values) => `Kính gửi Ban Giám đốc Chuyên môn,

Tôi là ${name}, thuộc ${dept}. Qua quá trình công tác, tôi có đề xuất chuyên môn:

- Nội dung: ${values[0] || "____________________________"}
- Lý do/hiệu quả: ${values[1] || "_______________________"}

Kính mong được xem xét và phản hồi.

Trân trọng,
${name}`,
  },
  complaint: {
    subject: "Đơn phản ánh nội bộ",
    fields: [
      { label: "Nội dung phản ánh", placeholder: "VD: Vấn đề trong ca trực" },
      { label: "Thời điểm xảy ra", placeholder: "VD: 01/01/2025, 14h" },
    ],
    content: (name, dept, values) => `Kính gửi Ban Giám đốc và Phòng Nhân sự,

Tôi là ${name}, làm việc tại ${dept}. Tôi xin phản ánh vấn đề:

- Nội dung: ${values[0] || "___________________________"}
- Thời điểm: ${values[1] || "__________________________"}

Kính mong được xác minh và xử lý phù hợp.

Trân trọng,
${name}`,
  },
  "work-confirmation": {
    subject: "Đơn xin xác nhận công tác",
    fields: [
      { label: "Thời gian làm việc", placeholder: "VD: Từ 01/2020 đến nay" },
      { label: "Chức vụ", placeholder: "VD: Bác sĩ nội khoa" },
      { label: "Mục đích", placeholder: "VD: Làm hồ sơ vay ngân hàng" },
    ],
    content: (name, dept, values) => `Kính gửi Phòng Nhân sự,

Tôi là ${name}, hiện công tác tại ${dept}. Tôi xin xác nhận:

- Thời gian làm việc: ${values[0] || "___ đến nay"}
- Chức vụ: ${values[1] || "______________________"}
- Mục đích: ${values[2] || "________________________"}

Trân trọng,
${name}`,
  },
  "salary-confirmation": {
    subject: "Đơn xin xác nhận lương",
    fields: [
      { label: "Mục đích", placeholder: "VD: Làm hồ sơ vay ngân hàng" },
    ],
    content: (name, dept, values) => `Kính gửi Phòng Kế toán,

Tôi là ${name}, công tác tại ${dept}. Tôi làm đơn xin xác nhận thu nhập hàng tháng để phục vụ cho việc ${values[0] || "___________________________"}.

Kính mong được hỗ trợ xác nhận.

Trân trọng,
${name}`,
  },
  other: {
    subject: "",
    fields: [],
    content: () => "",
  },
  "low-stock-notification": {
    subject: "Đơn thông báo thuốc sắp hết",
    fields: [
      { label: "Tên thuốc", placeholder: "VD: Paracetamol 500mg" },
      { label: "Số lượng còn lại", placeholder: "VD: 20 hộp" },
      { label: "Người phụ trách", placeholder: "VD: Dược sĩ Trần Văn B" },
    ],
    content: (name, dept, values) => `Kính gửi Phòng Vật tư và Quản lý Dược,

Tôi là ${name}, công tác tại ${dept}. Qua kiểm tra kho, tôi xin thông báo về tình trạng thuốc sắp hết như sau:

- Tên thuốc: ${values[0] || "__________"}
- Số lượng còn lại: ${values[1] || "__________"}
- Người phụ trách kho: ${values[2] || "__________"}

Kính mong Quý phòng xem xét và cấp bổ sung kịp thời để tránh gián đoạn điều trị.

Trân trọng,
${name}`,
  },
  "incident-report": {
    subject: "Đơn báo cáo sự cố y khoa",
    fields: [
      { label: "Thời gian xảy ra", placeholder: "VD: 12h30 ngày 01/08/2025" },
      { label: "Địa điểm", placeholder: "VD: Khoa Hồi sức cấp cứu" },
      { label: "Mô tả sự cố", placeholder: "VD: Bệnh nhân phản ứng thuốc XYZ..." },
    ],
    content: () => "",
  },
  "schedule-adjustment": {
    subject: "Đơn yêu cầu điều chỉnh lịch trực",
    fields: [
      { label: "Ngày cần điều chỉnh", placeholder: "VD: 05/08/2025" },
      { label: "Lịch cũ", placeholder: "VD: Trực ca đêm 23h–7h" },
      { label: "Lý do", placeholder: "VD: Có việc gia đình đột xuất" },
    ],
    content: () => "",
  },
  "uniform-request": {
    subject: "Đơn đề nghị cấp phát đồng phục",
    fields: [
      { label: "Loại đồng phục", placeholder: "VD: Áo blouse dài tay" },
      { label: "Kích cỡ", placeholder: "VD: Size M" },
      { label: "Lý do", placeholder: "VD: Đồng phục cũ bị rách" },
    ],
    content: () => "",
  },
  "advance-request": {
    subject: "Đơn xin tạm ứng",
    fields: [
      { label: "Số tiền", placeholder: "VD: 2,000,000 VND" },
      { label: "Lý do tạm ứng", placeholder: "VD: Đi công tác hỗ trợ khám ngoại viện" },
      { label: "Ngày hoàn ứng dự kiến", placeholder: "VD: 15/08/2025" },
    ],
    content: () => "",
  },
  "supply-inventory-request": {
    subject: "Đơn đề nghị kiểm kê vật tư",
    fields: [
      { label: "Kho vật tư cần kiểm kê", placeholder: "VD: Kho dược nội trú" },
      { label: "Lý do kiểm kê", placeholder: "VD: Phát hiện lệch số lượng trên hệ thống" },
    ],
    content: () => "",
  },
};

const SendApplication = () => {
  const [view, setView] = useState("list"); // "list" or "form"
  const [templateType, setTemplateType] = useState("other");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [fieldValues, setFieldValues] = useState([]);
  const [employeeInfo, setEmployeeInfo] = useState({ name: "", department: "" });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch employee info and applications
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?._id) {
          message.error("Không tìm thấy thông tin người dùng.");
          return;
        }

        const res = await axios.get(`/api/applications/${user._id}`);
        const { name, department } = res.data;
        setEmployeeInfo({
          name: name || "",
          department: department?.name || "",
        });
      } catch (error) {
        console.error("❌ Lỗi khi tải thông tin nhân viên:", error);
        message.error("Không thể tải thông tin nhân viên.");
      }
    };

    const fetchApplications = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?._id) {
          message.error("Không tìm thấy thông tin người dùng.");
          return;
        }

        const res = await axios.get(`/api/applications/sender/${user._id}`);
        setApplications(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách đơn:", error);
        message.error("Không thể tải danh sách đơn.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
    if (view === "list") {
      fetchApplications();
    }
  }, [view]);

  const handleTemplateChange = (value) => {
    setTemplateType(value);
    const selected = templates[value];
    if (selected && value !== "other") {
      setSubject(selected.subject || "");
      setFieldValues(new Array(selected.fields.length).fill(""));
    } else {
      setSubject("");
      setFieldValues([]);
    }
    setContent(""); // reset content để user nhập tay
  };

  const handleFieldChange = (index, value) => {
    const newFieldValues = [...fieldValues];
    newFieldValues[index] = value;
    setFieldValues(newFieldValues);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };


  const handleSubmit = async () => {
    if (!subject || !content) {
      return message.warning("Vui lòng điền đầy đủ thông tin.");
    }

    setLoading(true);
    try {
      const sender = JSON.parse(localStorage.getItem("user"));
      await axios.post("/api/applications", {
        senderId: sender._id,
        subject,
        content,
        date: new Date(),
        templateType,
        fields: fieldValues,
      });

      message.success("Gửi đơn thành công!");
      setTemplateType("other");
      setSubject("");
      setContent("");
      setFieldValues([]);
      setView("list"); // Switch back to list view after submission
    } catch (err) {
      console.error(err);
      message.error("Gửi đơn thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Table columns for displaying applications
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Loại đơn",
      dataIndex: "templateType",
      key: "templateType",
      render: (type) => type || "Khác",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "approved") color = "green";
        if (status === "rejected") color = "red";
        if (status === "processing") color = "orange";
        return <Tag color={color}>{status || "pending"}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Phản hồi",
      dataIndex: "reply",
      key: "reply",
      render: (reply) => reply || "Chưa có phản hồi",
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      {view === "list" ? (
        <Card style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Title level={3}>Danh Sách Đơn Yêu Cầu</Title>
            <Button type="primary" size="large" onClick={() => setView("form")}>
              Tạo Đơn Mới
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Chưa có đơn nào." }}
          />
        </Card>
      ) : (
        <div>
          <Button style={{ marginBottom: 16 }} onClick={() => setView("list")}>
            Quay lại danh sách
          </Button>
          <Card variant="outlined" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
              Gửi Đơn Yêu Cầu
            </Title>

            {employeeInfo.name && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <Text strong>Người gửi</Text>
                  <Input value={employeeInfo.name} disabled style={{ marginTop: 8 }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <Text strong>Khoa</Text>
                  <Input value={employeeInfo.department} disabled style={{ marginTop: 8 }} />
                </div>
              </>
            )}

            <div style={{ marginBottom: 20 }}>
              <Text strong>Chọn mẫu đơn</Text>
              <Select
                showSearch
                placeholder="Chọn hoặc tìm mẫu đơn"
                onChange={handleTemplateChange}
                value={templateType}
                style={{ width: "100%", marginTop: 8 }}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {Object.entries(templates)
                  .filter(([key]) => key !== "other")
                  .map(([key, val]) => (
                    <Option key={key} value={key}>
                      {val.subject}
                    </Option>
                  ))}
                <Option value="other">Khác / tạo đơn mới</Option>
              </Select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text strong>Tiêu đề đơn</Text>
              <Input
                placeholder="Nhập tiêu đề đơn"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>

            {templateType !== "other" &&
              templates[templateType].fields.map((field, index) => (
                <div key={index} style={{ marginBottom: 20 }}>
                  <Text strong>{field.label}</Text>
                  <Input
                    placeholder={field.placeholder}
                    value={fieldValues[index] || ""}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              ))}

            <div style={{ marginBottom: 30 }}>
              <Text strong>Chi tiết</Text>
              <Input.TextArea
                placeholder={templateType === "other" ? "Nhập nội dung chi tiết" : ""}
                value={content}
                onChange={handleContentChange}
                rows={6}
                style={{ marginTop: 8 }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <Button type="primary" size="large" onClick={handleSubmit} loading={loading}>
                Gửi Đơn
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SendApplication;