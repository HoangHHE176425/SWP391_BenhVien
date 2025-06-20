import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authContext';
import { ChevronDown, ChevronRight, FileText, Calendar, DollarSign, User, Loader2, Search, Filter, CheckCircle, Clock, XCircle, CreditCard, Trash2, Check } from 'lucide-react';
const statusText = {
    Paid: 'Đã thanh toán',
    Pending: 'Đang chờ',
    Canceled: 'Đã hủy',
};

const statusConfig = {
    Paid: {
        text: 'Đã thanh toán',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
        dot: 'bg-emerald-500'
    },
    Pending: {
        text: 'Đang chờ',
        class: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
        dot: 'bg-amber-500'
    },
    Canceled: {
        text: 'Đã hủy',
        class: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        dot: 'bg-red-500'
    }
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
    const [serviceData, setServiceData] = useState({});
    const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
    const [markPaidLoading, setMarkPaidLoading] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const handleMarkAsPaid = async (invoiceId) => {
        setMarkPaidLoading(invoiceId);
        // Simulate API call
        const token = localStorage.getItem("token");
        const response = await axios.put(
            `http://localhost:9999/api/staff/services/paid/${invoiceId}`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
                body: { method: "Cash" }
            }
        );

        // Update invoice status to Paid
        setInvoices(prev => prev.map(invoice =>
            invoice._id === invoiceId
                ? { ...invoice, status: 'Paid' }
                : invoice
        ));

        setMarkPaidLoading(null);
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này không?')) {
            return;
        }

        setDeleteLoading(invoiceId);
        // Simulate API call
        const token = localStorage.getItem("token");
        const response = await axios.delete(
            `http://localhost:9999/api/staff/services/delete${invoiceId}`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        // Remove invoice from list
        setInvoices(prev => prev.filter(invoice => invoice._id !== invoiceId));

        // Close expanded services if this invoice was open
        if (openInvoiceId === invoiceId) {
            setOpenInvoiceId(null);
        }

        setDeleteLoading(null);
    };

    const toggleServices = async (invoiceId) => {
        if (openInvoiceId === invoiceId) {
            setOpenInvoiceId(null); // Đóng nếu đã mở
            return;
        }

        if (serviceData[invoiceId]) {
            setOpenInvoiceId(invoiceId); // Mở nếu đã có dữ liệu
            return;
        }

        try {
            setLoadingInvoiceId(invoiceId);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:9999/api/staff/services/${invoiceId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setServiceData(prev => ({
                ...prev,
                [invoiceId]: response.data.services || []
            }));
            setOpenInvoiceId(invoiceId);
        } catch (err) {
            alert("Không lấy được thông tin dịch vụ.");
            console.error(err);
        } finally {
            setLoadingInvoiceId(null);
        }
    };
    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('http://localhost:9999/api/staff/invoices');
                setInvoices(response.data?.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching invoices:', err);
                setError(err.response?.data?.message || 'Lỗi khi tải danh sách hóa đơn');
                setLoading(false);
            }
        };

        // if (user?._id && !authLoading) {
        //     fetchInvoices();
        // } else if (!authLoading) {
        //     setError('Vui lòng đăng nhập để tải dữ liệu');
        //     setLoading(false);
        // }
        fetchInvoices();
    }, [user?._id, authLoading]);

    const handlePayInvoice = async (invoiceId) => {
        setPaymentLoading(invoiceId);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:9999/api/staff/create-payment-link',
                { invoiceId, method: 'Credit Card' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                window.location.href = response.data.data.checkoutUrl;
            } else {
                alert(response.data.message);
            }
        } catch (err) {
            console.error('Lỗi khi tạo link thanh toán:', err);
            alert(err.response?.data?.message || 'Lỗi khi tạo link thanh toán');
        } finally {
            setPaymentLoading(null);
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (invoice.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'Paid').length,
        pending: invoices.filter(i => i.status === 'Pending').length,
        canceled: invoices.filter(i => i.status === 'Canceled').length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Đang tải...</p>
                </div>
            </div>
        );
    }
    const handleService = async (invoiceId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:9999/api/staff/services/${invoiceId}`,
                {}, // Gửi rỗng body để tránh lỗi
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                const services = response.data.services;
                console.log("Danh sách dịch vụ:", services);
                // Tùy bạn xử lý dữ liệu services tại đây
            } else {
                alert(response.data.message || "Không lấy được dịch vụ");
            }
        } catch (err) {
            console.error('Lỗi khi lấy danh sách dịch vụ:', err);
            alert(err.response?.data?.message || 'Lỗi khi lấy danh sách dịch vụ');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-8 shadow-lg border border-red-100 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-800">Có lỗi xảy ra</h3>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );//code co tailwind ma no co tailwind dau
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Danh sách hóa đơn</h1>
                    </div>
                    <p className="text-slate-600">Theo dõi và quản lý tất cả hóa đơn của bạn</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Tổng hóa đơn</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            </div>
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Đã thanh toán</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Đang chờ</p>
                                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Đã hủy</p>
                                <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Tổng giá trị</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(stats.totalAmount / 1000).toFixed(1)}K
                                </p>
                            </div>
                            <CreditCard className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo số hóa đơn hoặc tên khách hàng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Hóa đơn
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Hồ sơ
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Dịch vụ
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Tổng tiền
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((invoice, index) => {
                                    const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
                                    return (
                                        <React.Fragment key={invoice._id}>
                                            <tr
                                                className="hover:bg-slate-50 transition-colors duration-200 group"
                                                style={{
                                                    animation: `fadeInUp 0.4s ease forwards ${index * 0.05}s`,
                                                    opacity: 0,
                                                    transform: 'translateY(10px)'
                                                }}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-nowrap font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                                                            <p className="text-sm text-slate-500">
                                                                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded-full">
                                                            <User className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-nowrap font-medium text-slate-800">{invoice.userId?.name || 'N/A'}</p>
                                                            <p className="text-nowrap text-sm text-slate-500">{invoice.userId?.email || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-nowrap inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                                        {invoice.profileId?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <button
                                                        onClick={() => toggleServices(invoice._id)}
                                                        className="group/btn inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-all duration-200 hover:shadow-sm border border-blue-200 hover:border-blue-300"
                                                    >
                                                        <span className="text-nowrap text-sm">
                                                            {invoice.services?.length || 0} dịch vụ
                                                        </span>
                                                        <div className="transform transition-transform duration-200 ease-in-out">
                                                            {openInvoiceId === invoice._id ? (
                                                                <ChevronDown className="h-4 w-4 group-hover/btn:scale-110" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 group-hover/btn:scale-110" />
                                                            )}
                                                        </div>
                                                    </button>
                                                </td>

                                                <td className="py-4 px-6">
                                                    <p className="text-nowrap font-bold text-slate-800 text-lg">
                                                        {invoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${statusConfig[invoice.status]?.class || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                        <span className={`text-nowrap w-2 h-2 rounded-full ${statusConfig[invoice.status]?.dot || 'bg-gray-500'}`}></span>
                                                        {statusText[invoice.status] || invoice.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        {/* Payment Button - Only for Pending invoices */}
                                                        {invoice.status === 'Pending' && (
                                                            <button
                                                                onClick={() => handlePayInvoice(invoice._id)}
                                                                disabled={paymentLoading === invoice._id}
                                                                className="text-nowrap inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                                                            >
                                                                {paymentLoading === invoice._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CreditCard className="w-4 h-4" />
                                                                )}
                                                                Thanh toán
                                                            </button>
                                                        )}

                                                        {/* Mark as Paid Button - Only for Pending invoices */}
                                                        {invoice.status === 'Pending' && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(invoice._id)}
                                                                disabled={markPaidLoading === invoice._id}
                                                                className="text-nowrap inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-sm"
                                                            >
                                                                {markPaidLoading === invoice._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                                Thanh toán
                                                            </button>
                                                        )}

                                                        {/* Delete Button - Available for all invoices */}
                                                        <button
                                                            onClick={() => handleDeleteInvoice(invoice._id)}
                                                            disabled={deleteLoading === invoice._id}
                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                                                        >
                                                            {deleteLoading === invoice._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                            Xóa
                                                        </button>

                                                        {/* Status for non-pending invoices */}
                                                        {invoice.status !== 'Pending' && (
                                                            <span className="text-slate-400 text-sm font-medium ml-2">
                                                                {invoice.status === 'Paid' ? 'Đã xử lý' : 'Đã hủy'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Enhanced Services Expansion Row */}
                                            {openInvoiceId === invoice._id && (
                                                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                                    <td colSpan={7} className="px-6 py-6 border-l-4 border-blue-400">
                                                        <div className="transition-all duration-300 ease-in-out">
                                                            {loadingInvoiceId === invoice._id ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <div className="flex items-center space-x-3">
                                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                                        <span className="text-slate-600 font-medium">Đang tải thông tin dịch vụ...</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                                                                        <FileText className="h-4 w-4" />
                                                                        <span>Chi tiết dịch vụ</span>
                                                                    </h4>
                                                                    <div className="grid gap-3">
                                                                        {(serviceData[invoice._id] || []).map((service, serviceIndex) => (
                                                                            <div
                                                                                key={service._id}
                                                                                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                                                                                style={{
                                                                                    animationDelay: `${serviceIndex * 100}ms`,
                                                                                    animation: 'slideInUp 0.3s ease-out forwards'
                                                                                }}
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-start space-x-3">
                                                                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                                                                                        <div>
                                                                                            <h5 className="font-semibold text-slate-900">{service.name}</h5>
                                                                                            <p className="text-slate-600 text-sm mt-1">{service.description}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-shrink-0 ml-4">
                                                                                    <span className="font-bold text-lg text-slate-900">
                                                                                        {service.price.toLocaleString('vi-VN')} VNĐ
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
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
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">Không tìm thấy hóa đơn nào</p>
                            <p className="text-slate-400">Thử thay đổi bộ lọc để xem thêm kết quả</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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