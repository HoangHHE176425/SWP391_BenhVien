import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaToggleOn, FaToggleOff, FaHistory } from 'react-icons/fa';


const API = 'http://localhost:9999/api/staff';

const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/all/services`, {
        params: { search, sort, priceMin, priceMax, page, limit },
      });
      setServices(res.data.services);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchLogs = async (serviceId) => {
    try {
      setLogLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/logs/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogData(res.data.logs || []);
      setShowLogModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử dịch vụ:", err);
      alert("Không thể tải lịch sử.");
    } finally {
      setLogLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/toggle/services/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchServices(); // làm mới danh sách
    } catch (err) {
      alert("Không thể chuyển trạng thái dịch vụ.");
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchServices();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, sort, priceMin, priceMax, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;

    try {
      await axios.delete(`${API}/delete/services/${id}`);
      fetchServices();
    } catch (err) {
      alert('Lỗi khi xóa dịch vụ');
      console.error(err);
    }
  };
  const handlePrev = () => page > 1 && setPage(page - 1);
  const handleNext = () => page < totalPages && setPage(page + 1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Danh sách Dịch vụ</h2>
        <Link to="/staff/services/create">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow-md transition duration-200">
            + Thêm dịch vụ
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <input
          className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="number"
          className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Giá từ"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          type="number"
          className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Giá đến"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
        <select
          className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Tên A-Z</option>
          <option value="-price">Giá giảm dần</option>
          <option value="price">Giá tăng dần</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        ) : services.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Không tìm thấy dịch vụ nào.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-[5%] px-2 py-3 text-left text-sm font-semibold text-gray-700">STT</th>
                <th className="w-[10%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Mã</th>
                <th className="w-[15%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                <th className="w-[25%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Mô tả</th>
                <th className="w-[10%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Giá (₫)</th>
                <th className="w-[10%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="w-[25%] px-2 py-3 text-left text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={service._id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {service.serviceCode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {service.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {service.price.toLocaleString()}
                  </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          service.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {service.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      {/* Nút Sửa */}
                      <button
                        onClick={() => navigate(`/staff/services/edit/${service._id}`)}
                        title="Chỉnh sửa dịch vụ"
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300 rounded-full text-sm font-medium transition"
                      >
                        <FaEdit size={14} />
                        <span>Sửa</span>
                      </button>

                      {/* Nút Bật / Tắt */}
                      <button
                        onClick={() => handleToggleStatus(service._id)}
                        title={
                          service.status === 'active'
                            ? 'Tạm dừng dịch vụ'
                            : 'Kích hoạt dịch vụ'
                        }
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition
                          ${
                            service.status === 'active'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
                          }`}
                      >
                        {service.status === 'active' ? (
                          <>
                            <FaToggleOff size={16} /> <span>Tắt</span>
                          </>
                        ) : (
                          <>
                            <FaToggleOn size={16} /> <span>Bật</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => fetchLogs(service._id)}
                        title="Xem lịch sử chỉnh sửa"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-full text-sm font-medium transition"
                      >
                        <FaHistory size={14} />
                        <span>Log</span>
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          onClick={handlePrev}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg transition duration-200 ${page === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
          Trước
        </button>
        <span className="text-gray-700">Trang {page} / {totalPages}</span>
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-lg transition duration-200 ${page === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
          Tiếp
        </button>
      </div>


      {/* Modal hiển thị log */}
{showLogModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lịch sử thao tác</h3>
        <button
          onClick={() => setShowLogModal(false)}
          className="text-gray-500 hover:text-red-500 text-xl"
        >
          &times;
        </button>
      </div>
      <div className="p-4">
        {logLoading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : logData.length === 0 ? (
          <p className="text-gray-500">Không có log nào.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {logData.map((log) => (
              <li key={log._id} className="py-3 text-sm text-gray-700">
                <div className="font-medium capitalize">{log.action}</div>
                <div className="text-gray-600">{log.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                {log.performedBy?.employeeCode
                  ? `Thực hiện bởi: ${log.performedBy.name || 'Không rõ tên'} (${log.performedBy.employeeCode})`
                  : "Thực hiện bởi: N/A"}
                  {" | "}
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-4 border-t text-right">
        <button
          onClick={() => setShowLogModal(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default ServiceListPage;
