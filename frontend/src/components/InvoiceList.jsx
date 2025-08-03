import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authContext';
import { ChevronDown, ChevronRight, FileText, Loader2, Search, Filter, CheckCircle, Clock, XCircle, CreditCard, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Status configuration
const statusConfig = {
  Paid: {
    text: 'Đã thanh toán',
    class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle,
    dot: 'bg-emerald-600',
  },
  Pending: {
    text: 'Đang chờ',
    class: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Clock,
    dot: 'bg-amber-600',
  },
  Canceled: {
    text: 'Đã hủy',
    class: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
    dot: 'bg-red-600',
  },
};

const InvoiceList = () => {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [openInvoiceId, setOpenInvoiceId] = useState(null);
  const [openMedicineInvoiceId, setOpenMedicineInvoiceId] = useState(null);
  const [serviceData, setServiceData] = useState({});
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [markPaidLoading, setMarkPaidLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:9999/api/receptionist/invoices', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: pageSize },
      });
      if (response.data.success) {
        setInvoices(response.data.data || []);
        setTotalInvoices(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error(response.data.message || 'Lỗi khi tải danh sách hóa đơn');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?._id) fetchInvoices();
  }, [currentPage, pageSize, user?._id, authLoading]);

  const handleMarkAsPaid = async (invoiceId) => {
    setMarkPaidLoading(invoiceId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:9999/api/receptionist/services/paid/${invoiceId}`,
        { method: 'Cash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice._id === invoiceId ? { ...invoice, status: 'Paid' } : invoice
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đánh dấu hóa đơn đã thanh toán');
    } finally {
      setMarkPaidLoading(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này không?')) return;
    setDeleteLoading(invoiceId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:9999/api/receptionist/services/delete/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices((prev) => prev.filter((invoice) => invoice._id !== invoiceId));
      if (openInvoiceId === invoiceId) setOpenInvoiceId(null);
      if (openMedicineInvoiceId === invoiceId) setOpenMedicineInvoiceId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa hóa đơn');
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleServices = async (invoiceId) => {
    if (openInvoiceId === invoiceId) {
      setOpenInvoiceId(null);
      return;
    }
    if (serviceData[invoiceId]) {
      setOpenInvoiceId(invoiceId);
      return;
    }
    try {
      setLoadingInvoiceId(invoiceId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:9999/api/receptionist/services/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServiceData((prev) => ({
        ...prev,
        [invoiceId]: response.data.services || [],
      }));
      setOpenInvoiceId(invoiceId);
    } catch (err) {
      alert('Không lấy được thông tin dịch vụ.');
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const toggleMedicines = (invoiceId) => {
    if (openMedicineInvoiceId === invoiceId) {
      setOpenMedicineInvoiceId(null);
    } else {
      setOpenMedicineInvoiceId(invoiceId);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setPaymentLoading(invoiceId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:9999/api/receptionist/create-payment-link',
        { invoiceId, method: 'Credit Card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        window.location.href = response.data.data.checkoutUrl;
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo link thanh toán');
    } finally {
      setPaymentLoading(null);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.profileId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'Paid').length,
    pending: invoices.filter((i) => i.status === 'Pending').length,
    canceled: invoices.filter((i) => i.status === 'Canceled').length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-14 h-14 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-100 max-w-md w-full">
          <div className="flex items-center gap-4 mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
            <h3 className="text-2xl font-bold text-red-700">Lỗi hệ thống</h3>
          </div>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Tạo hóa đơn thanh toán</h1>
            <button
              onClick={() => navigate('/receptionist/invoices/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>Tạo hóa đơn mới</span>
            </button>
          </div>
          <p className="text-gray-600 text-base">Theo dõi và quản lý hóa đơn với giao diện trực quan và dễ sử dụng</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[
            { label: 'Tổng hóa đơn', value: stats.total, icon: FileText, color: 'text-gray-700' },
            { label: 'Đã thanh toán', value: stats.paid, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'Đang chờ', value: stats.pending, icon: Clock, color: 'text-amber-600' },
            { label: 'Đã hủy', value: stats.canceled, icon: XCircle, color: 'text-red-600' },
            {
              label: 'Tổng giá trị',
              value: `${(stats.totalAmount / 1000).toFixed(1)}K`,
              icon: CreditCard,
              color: 'text-indigo-600',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color} opacity-90`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Tìm kiếm hóa đơn hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-gray-800"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Pending">Đang chờ</option>
                <option value="Canceled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Hóa đơn', 'Hồ sơ', 'Dịch vụ', 'Thuốc', 'Tổng tiền', 'Trạng thái', 'Hành động'].map(
                    (header, index) => (
                      <th
                        key={index}
                        className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-widest"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((invoice, index) => {
                  const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
                  return (
                    <React.Fragment key={invoice._id}>
                      <tr
                        className="hover:bg-gray-50 transition-all duration-300"
                        style={{ animation: `fadeInUp 0.4s ease forwards ${index * 0.05}s` }}
                      >
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-100 rounded-xl hover:bg-indigo-200 transition-all duration-200">
                              <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-base">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 shadow-sm">
                            {invoice.profileId?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <button
                            onClick={() => toggleServices(invoice._id)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-medium transition-all duration-200 shadow-sm"
                          >
                            <span>{invoice.services?.length || 0} dịch vụ</span>
                            {openInvoiceId === invoice._id ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="py-5 px-6">
                          <button
                            onClick={() => toggleMedicines(invoice._id)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-all duration-200 shadow-sm"
                          >
                            <span>{invoice.medicines?.length || 0} thuốc</span>
                            {openMedicineInvoiceId === invoice._id ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="py-5 px-6">
                          <p className="font-bold text-gray-900 text-lg">
                            {invoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${statusConfig[invoice.status]?.class} shadow-sm`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[invoice.status]?.dot}`}></span>
                            {statusConfig[invoice.status]?.text || invoice.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            {invoice.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handlePayInvoice(invoice._id)}
                                  disabled={paymentLoading === invoice._id}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-all duration-200 shadow-sm transform hover:-translate-y-0.5"
                                  title="Thanh toán qua thẻ"
                                >
                                  {paymentLoading === invoice._id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-5 h-5" />
                                  )}
                                  <span>Thanh toán</span>
                                </button>
                                <button
                                  onClick={() => handleMarkAsPaid(invoice._id)}
                                  disabled={markPaidLoading === invoice._id}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-all duration-200 shadow-sm transform hover:-translate-y-0.5"
                                  title="Đánh dấu đã thanh toán bằng tiền mặt"
                                >
                                  {markPaidLoading === invoice._id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Check className="w-5 h-5" />
                                  )}
                                  <span>Đã trả</span>
                                </button>
                              </>
                            )}
                            {/* <button
                              onClick={() => handleDeleteInvoice(invoice._id)}
                              disabled={deleteLoading === invoice._id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-all duration-200 shadow-sm transform hover:-translate-y-0.5"
                              title="Xóa hóa đơn"
                            >
                              {deleteLoading === invoice._id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                              <span>Xóa</span>
                            </button> */}
                            {invoice.status !== 'Pending' && (
                              <span className="text-gray-500 text-sm font-medium italic">
                                {invoice.status === 'Paid' ? 'Đã xử lý' : 'Đã hủy'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Services Details */}
                      {openInvoiceId === invoice._id && (
                        <tr className="bg-indigo-50/50">
                          <td colSpan={7} className="px-6 py-6 border-l-4 border-indigo-400">
                            {loadingInvoiceId === invoice._id ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-3" />
                                <span className="text-gray-600 font-medium text-base">Đang tải thông tin dịch vụ...</span>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-indigo-600" />
                                  <span>Chi tiết dịch vụ</span>
                                </h4>
                                <div className="grid gap-4">
                                  {(serviceData[invoice._id] || []).map((service, serviceIndex) => (
                                    <div
                                      key={service._id}
                                      className="flex items-center justify-between p-5 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                                      style={{ animation: `slideInUp 0.3s ease-out forwards ${serviceIndex * 0.1}s` }}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2"></div>
                                        <div>
                                          <h5 className="font-semibold text-gray-900 text-base">{service.name}</h5>
                                          <p className="text-gray-600 text-sm">{service.description}</p>
                                        </div>
                                      </div>
                                      <span className="font-bold text-gray-900 text-base">
                                        {service.price.toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </div>
                                  ))}
                                  {(!serviceData[invoice._id] || serviceData[invoice._id].length === 0) && (
                                    <p className="text-gray-500 text-sm italic">Không có dịch vụ nào.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      {/* Medicines Details */}
                      {openMedicineInvoiceId === invoice._id && (
                        <tr className="bg-blue-50/50">
                          <td colSpan={7} className="px-6 py-6 border-l-4 border-blue-400">
                            <div className="space-y-6">
                              <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span>Chi tiết thuốc</span>
                              </h4>
                              <div className="grid gap-4">
                                {(invoice.medicines || []).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-5 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                                    style={{ animation: `slideInUp 0.3s ease-out forwards ${idx * 0.1}s` }}
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 text-base">
                                          {item.medicine?.name || 'Không rõ'}
                                        </h5>
                                        <p className="text-gray-600 text-sm">Số lượng: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <span className="font-bold text-gray-900 text-base">
                                      {(item.medicine?.unitPrice * item.quantity).toLocaleString('vi-VN')} VNĐ
                                      </span>
                                  </div>
                                ))}
                                {(!invoice.medicines || invoice.medicines.length === 0) && (
                                  <p className="text-gray-500 text-sm italic">Không có thuốc nào.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">Không tìm thấy hóa đơn</p>
              <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm để xem thêm kết quả</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalInvoices > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="text-gray-600 text-sm font-medium">
              Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalInvoices)} / {totalInvoices} hóa đơn
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl disabled:bg-gray-300 hover:bg-indigo-700 transition-all duration-200 shadow-sm text-sm font-medium"
              >
                Trước
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl disabled:bg-gray-300 hover:bg-indigo-700 transition-all duration-200 shadow-sm text-sm font-medium"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceList;