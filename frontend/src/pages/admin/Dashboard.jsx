import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "@ant-design/plots";
import { Card, Col, List, Row, Typography } from "antd";
import axios from "axios";
import { DatePicker, message } from "antd";
import dayjs from "dayjs";

const Dashboard = () => {
  const [userData, setUserData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [revenueMethods, setRevenueMethods] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [employeeStats, setEmployeeStats] = useState({
    totalEmployees: 0,
    roles: [],
  });
  const { RangePicker } = DatePicker;
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);
  const fetchStats = async (startDate, endDate) => {
    const query = `?start=${startDate}&end=${endDate}`;
    const [
      userRes,
      appointmentRes,
      revenueRes,
      typeRes,
      methodRes,
      summaryRes,
      employeeRes,
    ] = await Promise.all([
      axios.get(`/api/admin/user-registrations${query}`),
      axios.get(`/api/admin/appointments${query}`),
      axios.get(`/api/admin/revenue${query}`),
      axios.get(`/api/admin/appointment-types${query}`),
      axios.get(`/api/admin/revenue-methods${query}`),
      axios.get(`/api/admin/summaries${query}`),
      axios.get(`/api/admin/employee-stats${query}`),
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
    setRevenueData(
      revenueRes.data.map((item) => ({
        date: item._id,
        revenue: item.totalRevenue,
      }))
    );
    setAppointmentTypes(
      typeRes.data.map((item) => ({ type: item._id, count: item.count }))
    );
    setRevenueMethods(
      methodRes.data.map((item) => ({ method: item._id, total: item.total }))
    );
    setSummaries(summaryRes.data);

    setEmployeeStats(employeeRes.data);
  };

  useEffect(() => {
    const [start, end] = dateRange;
    fetchStats(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  }, [dateRange]);

  // Configs

  const userConfig = {
    data: userData,
    xField: "date",
    yField: "count",
    height: 250,
    smooth: true,
    point: { size: 4, shape: "circle" },
  };

  const appointmentConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 250,
    smooth: true,
    point: { size: 4, shape: "circle" },
  };

  const revenueConfig = {
    data: revenueData,
    xField: "date",
    yField: "revenue",
    height: 250,
    smooth: true,
    point: { size: 4, shape: "circle" },
  };

  // ✅ Cleaner vertical Bar config for appointment types
  const barConfig = {
    data: appointmentTypes,
    xField: "type",
    yField: "count",
    height: 250,
    columnWidthRatio: 0.6,
    colorField: "type",
    label: false, // disable numbers inside bars
  };

  // ✅ New Bar: Appointments per day
  const appointmentBarConfig = {
    data: appointmentData,
    xField: "date",
    yField: "count",
    height: 250,
    columnWidthRatio: 0.5,
    color: "#3498db",
    label: false,
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography.Title level={2}>Bảng Điều Khiển Quản Trị</Typography.Title>

      {/*
  <div style={{ marginBottom: "20px" }}>
    <RangePicker
      value={dateRange}
      onChange={(dates) => {
        if (!dates) return;
        setDateRange(dates);
      }}
      style={{ marginBottom: "20px" }}
    />
  </div> */}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card title="Tổng Số Người Dùng">{summaries.totalUsers}</Card>
        </Col>
        <Col span={6}>
          <Card title="Tổng Lịch Hẹn">{summaries.totalAppointments}</Card>
        </Col>
        <Col span={6}>
          <Card title="Tổng Doanh Thu">
            {(summaries.totalRevenue || 0).toLocaleString()} VND
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Thống Kê Nhân Viên">
            <p>Tổng Nhân Viên: {employeeStats.totalEmployees}</p>
            <ul>
              {employeeStats.roles.map((role) => (
                <li key={role._id}>
                  {role._id}: {role.count}
                </li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={12}>
          <Card title="Tăng Trưởng Người Dùng (30 Ngày)">
            <Line {...userConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Số Lịch Hẹn Theo Thời Gian (30 Ngày)">
            <Line {...appointmentConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={12}>
          <Card title="Xu Hướng Doanh Thu (30 Ngày)">
            <Line {...revenueConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Loại Lịch Hẹn (30 Ngày)">
            <Bar {...barConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={12}>
          <Card title="Số Lịch Hẹn Mỗi Ngày">
            <Bar {...appointmentBarConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Doanh Thu Theo Phương Thức Thanh Toán">
            <Pie
              data={revenueMethods}
              angleField="total"
              colorField="method"
              radius={0.9}
              legend={{ position: "bottom" }}
              label={false} // Ẩn nhãn lát pie
            />
            <List
              size="small"
              bordered={false}
              dataSource={revenueMethods}
              renderItem={(item) => {
                const total = revenueMethods.reduce(
                  (acc, cur) => acc + cur.total,
                  0
                );
                const percent = ((item.total / total) * 100).toFixed(1);
                return (
                  <List.Item>
                    <span style={{ fontWeight: 500 }}>{item.method}</span>:{" "}
                    {percent}%
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
