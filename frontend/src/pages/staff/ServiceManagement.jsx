import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mô tả</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Giá (₫)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service, index) => (
                <tr
                  key={service._id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{service.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{service.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {service.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      onClick={() => navigate(`/staff/services/edit/${service._id}`)}
                      className="bg-amber-400 hover:bg-amber-500 text-white px-4 py-1 rounded-lg shadow-sm transition duration-200"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg shadow-sm transition duration-200"
                    >
                      Xoá
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
    </div>
  );
};

export default ServiceListPage;
