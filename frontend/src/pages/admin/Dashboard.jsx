import React, { useEffect, useState } from "react";
import { Line, Bar } from "@ant-design/plots";
import { Card, Col, Row, Typography, Spin, DatePicker } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import styled from "styled-components";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Styled Components for custom styling
const DashboardContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const SummaryCard = styled(StyledCard)`
  text-align: center;
  .ant-card-head {
    background: #1890ff;
    color: white;
    border-radius: 12px 12px 0 0;
  }
`;

const ChartCard = styled(StyledCard)`
  .ant-card-body {
    padding: 16px;
  }
`;

const Dashboard = () => {
  const [userData, setUserData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [employeeStats, setEmployeeStats] = useState({
    totalEmployees: 0,
    roles: [],
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);

  const fetchStats = async (startDate, endDate) => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    const query = `?start=${startDate}&end=${endDate}`;
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const [
      userRes,
      appointmentRes,
      summaryRes,
      employeeRes,
    ] = await Promise.all([
      axios.get(`/api/admin/user-registrations${query}`, config),
      axios.get(`/api/admin/appointments${query}`, config),
      axios.get(`/api/admin/summaries${query}`, config),
      axios.get(`/api/admin/employee-stats${query}`, config),
    ]);

    setUserData(
      userRes.data.map((item) => ({ date: item._id, count: item.count }))
    );
    setAppointmentData(
      appointmentRes.data.map((item) => ({
        date: item._id,
        count: item.count,
      }))
    );
    setSummaries(summaryRes.data);
    setEmployeeStats(employeeRes.data);
  } catch (error) {
    console.error("❌ Fetching dashboard stats failed:", error);
    message.error("Không thể tải dữ liệu thống kê! " + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    const [start, end] = dateRange;
    fetchStats(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  }, [dateRange]);

  // Chart Configurations
  const userConfig = {
    data: userData,
    xField: "date",
    yField: "count",
    height: 300,
    smooth: true,
    point: { size: 5, shape: "circle" },
    color: "#1890ff",
    lineStyle: { lineWidth: 3 },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => ({
        name: "Người dùng mới",
        value: `${datum.count} người`,
      }),
    },
  };

  const appointmentConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 300,
    smooth: true,
    point: { size: 5, shape: "circle" },
    color: "#52c41a",
    lineStyle: { lineWidth: 3 },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => ({
        name: "Lịch hẹn",
        value: `${datum.count} lịch`,
      }),
    },
  };

  const appointmentBarConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 300,
    columnWidthRatio: 0.5,
    color: "#faad14",
    label: {
      position: "top",
      style: { fill: "#333", fontSize: 12 },
    },
    tooltip: {
      formatter: (datum) => ({
        name: "Lịch hẹn",
        value: `${datum.count} lịch`,
      }),
    },
  };

  return (
    <DashboardContainer>
      <Title level={2} style={{ marginBottom: 24, color: "#1f1f1f" }}>
        Thống Kê Hệ Thống
      </Title>

      <div style={{ marginBottom: 24 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (!dates) return;
            setDateRange(dates);
          }}
          style={{ width: 300, borderRadius: 8 }}
          size="large"
        />
      </div>

      {loading ? (
        <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard title="Tổng Số Người Dùng">
                <Text strong style={{ fontSize: 24 }}>
                  {summaries.totalUsers || 0}
                </Text>
              </SummaryCard>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard title="Tổng Lịch Hẹn">
                <Text strong style={{ fontSize: 24 }}>
                  {summaries.totalAppointments || 0}
                </Text>
              </SummaryCard>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard title="Thống Kê Nhân Viên">
                <Text strong style={{ fontSize: 18 }}>
                  Tổng Nhân Viên: {employeeStats.totalEmployees}
                </Text>
                <ul style={{ marginTop: 8, textAlign: "left" }}>
                  {employeeStats.roles.map((role) => (
                    <li key={role._id}>
                      {role._id}: {role.count}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <ChartCard title="Tăng Trưởng Người Dùng (30 Ngày)">
                <Line {...userConfig} />
              </ChartCard>
            </Col>
            <Col xs={24} lg={12}>
              <ChartCard title="Số Lịch Hẹn Theo Thời Gian (30 Ngày)">
                <Line {...appointmentConfig} />
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <ChartCard title="Số Lịch Hẹn Mỗi Ngày">
                <Bar {...appointmentBarConfig} />
              </ChartCard>
            </Col>
          </Row>
        </>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;