import React, { useState, useEffect } from "react";
import axios from "axios";

const PaymentView = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [sortField, setSortField] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState("desc");

  const [summary, setSummary] = useState({
    todayCount: 0,
    monthTotal: 0,
    pendingCount: 0,
    successRate: 0,
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:9999/api/staff/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit,
          search,
          status: statusFilter,
          method: methodFilter,
          sortField,
          sortOrder,
        },
      });

      const { data, pagination } = res.data;
      setPayments(data);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error("Error fetch payments:", err);
      setError(err.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:9999/api/staff/payments/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy thống kê:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, [page, search, statusFilter, methodFilter, sortField, sortOrder]);

  const handlePrev = () => page > 1 && setPage(page - 1);
  const handleNext = () => page < totalPages && setPage(page + 1);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản lý thanh toán</h1>

      {/* Dashboard thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Số thanh toán hôm nay</p>
          <p className="text-2xl font-bold text-blue-600">{summary.todayCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Tổng tiền thu tháng này</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.monthTotal.toLocaleString("vi-VN")} VNĐ
          </p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Thanh toán đang xử lý</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">Tỷ lệ thành công</p>
          <p className="text-2xl font-bold text-indigo-600">{summary.successRate}%</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 flex-wrap">
        <div className="flex-1">
          <label className="block mb-1 font-medium text-gray-700">Tìm theo mã hóa đơn</label>
          <input
            type="text"
            placeholder="Nhập mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border px-4 py-2 rounded shadow-sm"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
          >
            <option value="">Tất cả</option>
            <option value="Completed">Đã thanh toán</option>
            <option value="Pending">Đang xử lý</option>
            <option value="Failed">Thất bại</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Phương thức</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
          >
            <option value="">Tất cả</option>
            <option value="Credit Card">Thẻ tín dụng</option>
            <option value="Cash">Tiền mặt</option>
            <option value="Mobile App">Ứng dụng</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Sắp xếp theo</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
          >
            <option value="paymentDate">Ngày thanh toán</option>
            <option value="amount">Số tiền</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Thứ tự</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border px-4 py-2 rounded shadow-sm"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </div>
      </div>

      {/* Danh sách thanh toán */}
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : payments.length === 0 ? (
        <p>Không có bản ghi thanh toán nào.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-blue-50 text-sm font-semibold text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Profile</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {payments.map((p, i) => (
                  <tr key={p._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      {p.invoice?.invoiceNumber || "N/A"} (
                      {p.invoice?.totalAmount?.toLocaleString("vi-VN")} VNĐ)
                    </td>
                    <td className="px-4 py-3">
                      {p.user?.name || "N/A"} ({p.user?.email || ""})
                    </td>
                    <td className="px-4 py-3">{p.profile?.name || "N/A"}</td>
                    <td className="px-4 py-3">{p.amount?.toLocaleString("vi-VN")} VNĐ</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td
                      className={`px-4 py-3 font-medium ${p.status === "Completed"
                          ? "text-green-600"
                          : p.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                    >
                      {p.status}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(p.paymentDate).toLocaleDateString("vi-VN")}{" "}
                      {new Date(p.paymentDate).toLocaleTimeString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Trang trước
            </button>
            <span className="text-gray-700">
              Trang {page} trên {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Trang sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentView;
