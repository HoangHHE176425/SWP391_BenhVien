import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePayOS } from "@payos/payos-checkout"; // Chỉ import usePayOS

const InvoiceUser = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchText, setSearchText] = useState("");

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:9999/api/user/invoices", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: pageSize,
                    sort: sortField,
                    order: sortOrder,
                    status: statusFilter,
                    search: searchText,
                },
            });

            if (response.data.success) {
                setInvoices(response.data.data || []);
                setTotalInvoices(response.data.total || 0);
                setTotalPages(response.data.totalPages || 1);
            } else {
                throw new Error(response.data.message || "Lỗi khi tải danh sách hóa đơn");
            }
        } catch (err) {
            console.error("Error fetching invoices:", err);
            setError(err.response?.data?.message || "Lỗi khi tải danh sách hóa đơn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [currentPage, sortField, sortOrder, statusFilter]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchInvoices();
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handleCreatePayment = async (invoiceId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:9999/api/user/create-link`,
                { invoiceId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const checkoutUrl = response.data.checkoutUrl;
            if (!checkoutUrl) throw new Error("Không nhận được link thanh toán");

            // Cấu hình PayOS theo kiểu object config
            const payOSConfig = {
                RETURN_URL: "http://localhost:5173/invoice", // URL trả về sau khi thanh toán
                ELEMENT_ID: "embedded-payment-container", // ID của phần tử DOM để nhúng
                CHECKOUT_URL: checkoutUrl, // URL thanh toán từ API
                embedded: true, // Sử dụng chế độ nhúng
                onSuccess: async (event) => {
                    try {
                        await axios.put(
                            `http://localhost:9999/api/user/pay/success`,
                            { invoiceId },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                        alert("Thanh toán thành công!");
                        fetchInvoices();
                    } catch (err) {
                        console.error("Cập nhật trạng thái thanh toán thất bại:", err);
                        alert("Thanh toán thành công nhưng cập nhật trạng thái thất bại.");
                    }
                },
                onCancel: (event) => {
                    console.log("Thanh toán bị hủy:", event);
                    alert("Thanh toán đã bị hủy.");
                },
                onExit: (event) => {
                    console.log("Thanh toán thoát:", event);
                    alert("Thanh toán đã thoát.");
                },
            };

            const { open } = usePayOS(payOSConfig);
            open(); // Mở giao diện thanh toán
        } catch (err) {
            console.error("Tạo link thanh toán thất bại:", err);
            alert(`Lỗi: ${err.message}. Vui lòng kiểm tra kết nối hoặc thử lại sau.`);
        }
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Danh sách hóa đơn của bạn
            </h2>
            <div id="embedded-payment-container" style={{
                height: "350px",
            }} />
            {/* Filter & Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="createdAt">Ngày tạo</option>
                        <option value="status">Trạng thái</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Thứ tự:</label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Giảm dần</option>
                        <option value="asc">Tăng dần</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="Paid">Đã thanh toán</option>
                        <option value="Pending">Chưa thanh toán</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Nhập ID hóa đơn"
                        className="border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-600">Đang tải...</p>
            ) : error ? (
                <p className="text-center text-red-600">{error}</p>
            ) : invoices.length === 0 ? (
                <p className="text-center text-gray-600">Không có hóa đơn nào.</p>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Mã hóa đơn
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Ngày tạo
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Dịch vụ
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Tổng giá
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Người dùng
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Thanh toán
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => {
                                    const total = invoice.totalAmount;
                                    return (
                                        <tr
                                            key={invoice._id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {(currentPage - 1) * pageSize + index + 1}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {invoice.invoiceNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {invoice.services?.map((service) => (
                                                    <div key={service._id}>
                                                        {service.name} - {service.price.toLocaleString()}₫
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {total.toLocaleString()}₫
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {invoice.userId?.name} ({invoice.userId?.email})
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {invoice.status}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {invoice.status === "Pending" ? (
                                                    <button
                                                        onClick={() => handleCreatePayment(invoice._id)}
                                                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
                                                    >
                                                        Tạo thanh toán
                                                    </button>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-md ${currentPage === 1
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                } transition`}
                        >
                            Trang trước
                        </button>
                        <span className="text-sm text-gray-700">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-md ${currentPage === totalPages
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                } transition`}
                        >
                            Trang sau
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoiceUser;
