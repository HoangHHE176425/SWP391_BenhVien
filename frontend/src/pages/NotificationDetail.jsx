import React, { useEffect, useState } from "react";
import { Descriptions, Tag, Spin, Card, Button, Typography } from "antd";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "../assets/css/NotificationPages.css";
import dayjs from "dayjs";
const { Paragraph, Title } = Typography;

const NotificationDetail = () => {
  const { id } = useParams();
  const [notify, setNotify] = useState(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchDetail = async () => {
    const res = await axios.get("/api/user/getNoti", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const found = res.data.notifications.find((n) => n._id === id);
    if (found) {
      setNotify(found);
      await axios.put(
        `/api/user/markRead/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!notify)
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );

  return (
    <div
      style={{
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        className="fade-in"
        title={
          <Title level={2} style={{ margin: 0 }}>
            {notify.title}
          </Title>
        }
        extra={
          <Button type="primary" onClick={() => navigate("/notifications")}>
            Quay lại
          </Button>
        }
        style={{ width: "100%", maxWidth: 1000 }}
      >
        <Descriptions
          bordered
          column={1}
          labelStyle={{ fontWeight: 600, backgroundColor: "#fafafa" }}
          contentStyle={{ fontSize: 16 }}
        >
          <Descriptions.Item label="Nội dung">
            <Paragraph style={{ fontSize: 16 }}>{notify.content}</Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Mức độ ưu tiên">
            {notify.isUrgent ? (
              <Tag color="red">KHẨN CẤP</Tag>
            ) : (
              <Tag color="blue">Bình thường</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian tạo">
            {dayjs().format("DD-MM-YYYY HH:mm")}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default NotificationDetail;
