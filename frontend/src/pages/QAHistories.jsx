import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/QAHistories.css";

const QAHistories = () => {
  const [qaHistory, setQAHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("createdAt_desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const fetchQAHistory = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user._id) return;

    setLoading(true);
    try {
      const res = await axios.get("/api/user/qahistory", {
        params: {
          idUser: user._id,
          sort,
          statusfilter: statusFilter,
          search: searchTerm,
          page,
          limit: 10,
        },
      });

      setQAHistory(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Lỗi khi tải QA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQAHistory();
  }, [sort, statusFilter, page]);

  const handleSearch = () => {
    setPage(1); // reset về trang 1 khi tìm kiếm mới
    fetchQAHistory();
  };

  const handleCreateNewQA = () => navigate("/qa");

  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="sendqa-container">
      <h2 className="sendqa-title">Lịch Sử Câu Hỏi & Hỗ Trợ</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm kiếm tiêu đề..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="answered">Đã phản hồi</option>
          <option value="pending">Chờ xử lý</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt_desc">Mới nhất</option>
          <option value="createdAt_asc">Cũ nhất</option>
          <option value="title_asc">Tiêu đề A-Z</option>
          <option value="title_desc">Tiêu đề Z-A</option>
        </select>
        <button onClick={handleSearch}>Tìm</button>
      </div>

      <div className="animate-fade-in">
        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : qaHistory.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="sendqa-history-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Phản hồi</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {qaHistory.map((qa) => (
                    <tr key={qa._id}>
                      <td>{qa.title}</td>
                      <td className="truncate" style={{ maxWidth: "20rem" }}>
                        {qa.message}
                      </td>
                      <td>{qa.status || "Chờ xử lý"}</td>
                      <td>{qa.reply || "---"}</td>
                      <td>{new Date(qa.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={page === 1}>
                ◀ Trang trước
              </button>
              <span>Trang {page} / {totalPages}</span>
              <button onClick={handleNextPage} disabled={page === totalPages}>
                Trang sau ▶
              </button>
            </div>

            <button
              className="sendqa-create-new-btn"
              onClick={handleCreateNewQA}
              type="button"
            >
              Tạo QA mới
            </button>
          </>
        ) : (
          <>
            <p className="sendqa-history-empty">
              {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có yêu cầu nào."}
            </p>
            <button
              className="sendqa-create-new-btn"
              onClick={handleCreateNewQA}
              type="button"
            >
              Tạo QA mới
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QAHistories;
