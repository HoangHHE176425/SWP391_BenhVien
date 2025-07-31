import React, { useEffect, useState } from "react";
import {
  Table,
  Container,
  Spinner,
  Form,
  Pagination,
  Row,
  Col,
  Card,
  Badge,
  Button,
} from "react-bootstrap";
import axios from "axios";
import { message } from "antd";
import moment from "moment"; // Để format và lọc ngày

const QueueManagement = () => {
  const [queues, setQueues] = useState([]);
  const [groupedQueues, setGroupedQueues] = useState({}); // Nhóm theo room
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomFilter, setRoomFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(moment().format("YYYY-MM-DD")); // Mặc định hôm nay
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const params = {
        room: roomFilter,
        page: currentPage,
        limit: itemsPerPage,
      };
      const res = await axios.get("http://localhost:9999/api/apm/queues", { params });
      setQueues(res.data.queues || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);

      // Nhóm theo room từ queueEntries
      const grouped = res.data.queues.reduce((acc, queue) => {
        queue.queueEntries.forEach((entry) => {
          const room = entry.room;
          if (!acc[room]) acc[room] = [];
          acc[room].push({ ...entry, date: queue.date }); // Thêm date từ queue
        });
        return acc;
      }, {});
      setGroupedQueues(grouped);
    } catch (err) {
      console.error("Lỗi tải danh sách hàng đợi:", err.response?.data || err.message);
      setError("Không tải được danh sách hàng đợi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [currentPage, roomFilter]);

  // Hàm lọc entries theo dateFilter
  const filterEntriesByDate = (entries) => {
    if (!dateFilter) return entries;
    return entries.filter((entry) => moment(entry.date).format("YYYY-MM-DD") === dateFilter);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    return moment(isoString).format("DD/MM/YYYY HH:mm");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid className="py-5 bg-light">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý hàng đợi - Tổng số: {totalItems}</h4>
          <Button variant="secondary" onClick={fetchQueues}>
            Tải lại
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Control
                type="text"
                placeholder="Filter theo tên phòng..."
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="rounded-pill shadow-sm mb-2"
              />
            </Col>
            <Col md={3}>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-pill shadow-sm"
              />
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">
              <h5>{error}</h5>
              <Button variant="primary" onClick={fetchQueues}>
                Thử lại
              </Button>
            </div>
          ) : Object.keys(groupedQueues).length === 0 ? (
            <p className="text-muted text-center">Không có hàng đợi nào.</p>
          ) : (
            <>
              {Object.keys(groupedQueues).map((room) => {
                const filteredEntries = filterEntriesByDate(groupedQueues[room]);
                return (
                  <Card key={room} className="mb-4">
                    <Card.Header className="bg-secondary text-white">
                      <h5 className="mb-0">Phòng: {room}</h5>
                    </Card.Header>
                    <Card.Body>
                      {filteredEntries.length === 0 ? (
                        <p className="text-muted text-center">Lịch trống</p>
                      ) : (
                        <div className="table-responsive">
                          <Table striped hover className="table-align-middle">
                            <thead className="table-primary">
                              <tr>
                                <th>STT</th>
                                <th>Thứ tự</th>
                                <th>Bệnh nhân</th>
                                <th>SĐT</th>
                                <th>Bác sĩ</th>
                                <th>Triệu chứng</th>
                                <th>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEntries.map((entry, index) => (
                                <tr key={entry._id || index}>
                                  <td>{index + 1}</td>
                                  <td>{entry.position}</td>
                                  <td>{entry.profileId?.name || "Chưa có"}</td>
                                  <td>{entry.profileId?.phone || "Chưa có"}</td>
                                  <td>{entry.doctorId?.name || "Chưa có"}</td>
                                  <td>{entry.appointmentId?.symptoms || "Chưa có"}</td>
                                  <td>
                                    <Badge variant={entry.status === "queued" ? "warning" : "secondary"}>
                                      {entry.status === "queued" ? "Đang chờ" : entry.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                );
              })}

              <div className="d-flex justify-content-between align-items-center mt-4">
                <small className="text-muted">
                  Hiển thị từ {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((page) => (
                    <Pagination.Item
                      key={page + 1}
                      active={page + 1 === currentPage}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QueueManagement;