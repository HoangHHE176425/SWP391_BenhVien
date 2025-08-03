import React, { useState, useEffect } from "react";
import axios from "axios";

const CreateInvoice2 = () => {
    const [userId, setUserId] = useState("");
    const [records, setRecords] = useState([]);
    const [recordIds, setRecordIds] = useState([]);
    const [realuserId, setRealUserId] = useState("");
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [message, setMessage] = useState("");
    const [expandedRecords, setExpandedRecords] = useState({});
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("");
    // Fetch records when userId changes
    useEffect(() => {
        if (!userId.trim()) {
            setRecords([]);
            setRecordIds([]);
            return;
        }

        const fetchRecords = async () => {
            setLoadingProfiles(true);
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `http://localhost:9999/api/user/records?identityNumber=${userId.trim()}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setRecords(res.data.data || []);
                setRecordIds([]);
            } catch (error) {
                console.error("Lỗi tải hồ sơ bệnh án:", error);
                setRecords([]);
                setRecordIds([]);
            } finally {
                setLoadingProfiles(false);
            }
        };
        fetchRecords();
    }, [userId]);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    console.log("➡️ Bắt đầu tạo hóa đơn...");
    console.log("🔍 CCCD:", userId);
    console.log("📄 recordIds:", recordIds);

    if (userId.trim() && recordIds.length === 0) {
        console.warn("⚠️ Chưa chọn hồ sơ bệnh án");
        setMessage("Vui lòng chọn ít nhất một hồ sơ bệnh án");
        return;
    }

    const payload = {
        recordIds, // ✅ Không còn userId
    };

    console.log("📦 Payload gửi đi:", payload);

    setLoadingSubmit(true);
    try {
        const token = localStorage.getItem("token");
        console.log("🔐 Token:", token);

        const res = await axios.post(
            "http://localhost:9999/api/receptionist/invoices-from-records",
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ Phản hồi từ server:", res.data);

        setMessage(res.data.message || "Tạo hóa đơn thành công!");
        setUserId("");
        setRecords([]);
        setRecordIds([]);
        setExpandedRecords({});
    } catch (error) {
        console.error("❌ Lỗi tạo hóa đơn:", error);
        if (error.response) {
            console.error("📛 Phản hồi lỗi:", error.response.data);
            console.error("📟 Status:", error.response.status);
        }
        setMessage(error.response?.data?.message || "Lỗi server");
    } finally {
        setLoadingSubmit(false);
        console.log("🔁 Kết thúc xử lý tạo hóa đơn");
    }
};


    const toggleRecordDetails = (recordId) => {
        setExpandedRecords(prev => ({
            ...prev,
            [recordId]: !prev[recordId]
        }));
    };

    const handleRecordToggle = (recordId) => {
        setRecordIds(prev =>
            prev.includes(recordId)
                ? prev.filter(id => id !== recordId)
                : [...prev, recordId]
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                    Tạo Hóa Đơn Mới
                </h2>
                <p className="text-gray-500 text-lg">Nhập số CCCD và chọn hồ sơ bệnh án để tạo hóa đơn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer Information Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Thông Tin Khách Hàng</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {/* UserId input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nhập CCCD
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập số CCCD của khách hàng"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full border border-gray-200 px-5 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                            />
                        </div>


{/* Lọc theo trạng thái thanh toán */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Lọc theo trạng thái thanh toán
  </label>
  <select
    value={paymentFilter}
    onChange={(e) => setPaymentFilter(e.target.value)}
    className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500"
  >
    <option value="">Tất cả</option>
    <option value="unpaid">Chưa thanh toán</option>
    <option value="paid">Đã thanh toán</option>
  </select>
</div>


                        {/* Record selection with checkboxes */}
                        {userId.trim() && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    {loadingProfiles ? "Đang tải hồ sơ bệnh án..." : "Chọn hồ sơ bệnh án"}
                                </label>
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-5 bg-gray-50">
                                    {records.length > 0 ? (
                                        records
                                        .filter((record) => {
                                            if (statusFilter && record.status !== statusFilter) return false;
                                            if (paymentFilter === "paid" && !record.isPaid) return false;
                                            if (paymentFilter === "unpaid" && record.isPaid) return false;
                                            return true;
                                        })
                                        .map((record) => (
                                            <div
                                                key={record._id}
                                                className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-gray-100 transition-all duration-200 rounded-md px-2"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={recordIds.includes(record._id)}
                                                        onChange={() => handleRecordToggle(record._id)}
                                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                    />
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-gray-800">
                                                                {record.fullName} - {record.dateOfBirth?.slice(0, 10)}
                                                            </span>
                                                            <span className={`text-xs font-medium ${record.isPaid ? "text-green-600" : "text-red-600"}`}>
                                                                {record.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {record.admissionReason}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRecordDetails(record._id)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                                >
                                                    {expandedRecords[record._id] ? "Ẩn" : "Xem chi tiết"}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-red-500 text-sm text-center py-4">
                                            Không tìm thấy bệnh án nào với CCCD này.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Records Details */}
                    {recordIds.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h4 className="text-xl font-semibold text-gray-800 mb-4">Chi Tiết Hồ Sơ Đã Chọn</h4>
                            {recordIds.map(recordId => {
                                const record = records.find(r => r._id === recordId);
                                if (!record) return null;
                                return (
                                    <div key={record._id} className="border border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                                        <div
                                            className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 rounded-lg"
                                            onClick={() => toggleRecordDetails(record._id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="font-medium text-gray-800">{record.fullName}</span>
                                                <span className="text-sm text-gray-500">
                                                    ({record.dateOfBirth?.slice(0, 10)})
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                {expandedRecords[record._id] ? "Ẩn chi tiết" : "Xem chi tiết"}
                                            </span>
                                        </div>
                                        {expandedRecords[record._id] && (
                                            <div className="p-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                                                <ul className="text-sm text-gray-700 space-y-3">
                                                    <li><strong className="font-medium">Đã thanh toán:</strong> {record.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}</li>
                                                    {record.isPaid && (
                                                        <li><strong className="font-medium">Thời gian thanh toán:</strong> {record.paidAt?.slice(0, 10)}</li>
                                                    )}
                                                    <li><strong className="font-medium">Trạng thái thanh toán:</strong> {record.paymentStatus}</li>
                                                    <li><strong className="font-medium">Họ tên:</strong> {record.fullName}</li>
                                                    <li><strong className="font-medium">Ngày sinh:</strong> {record.dateOfBirth?.slice(0, 10)}</li>
                                                    <li><strong className="font-medium">Giới tính:</strong> {record.gender}</li>
                                                    <li><strong className="font-medium">Địa chỉ:</strong> {record.address}</li>
                                                    <li><strong className="font-medium">BHYT:</strong> {record.bhytCode ? "Có" : "Không"}</li>
                                                    <li><strong className="font-medium">Số CCCD:</strong> {record.identityNumber}</li>
                                                    <li><strong className="font-medium">Dân tộc:</strong> {record.ethnicity || "Không có thông tin"}</li>
                                                    <li><strong className="font-medium">Lý do nhập viện:</strong> {record.admissionReason}</li>
                                                    <li><strong className="font-medium">Chuẩn đoán vào viện:</strong> {record.admissionDiagnosis}</li>
                                                    <li><strong className="font-medium">Kết quả xét nghiệm:</strong> {record.admissionLabTest || "Không có thông tin"}</li>
                                                    <li><strong className="font-medium">Chuẩn đoán ra viện:</strong> {record.dischargeDiagnosis || "Không có thông tin"}</li>
                                                    <li><strong className="font-medium">Tóm tắt điều trị:</strong> {record.treatmentSummary || "Không có thông tin"}</li>
                                                    <li><strong className="font-medium">Ngày nhập viện:</strong> {record.admissionDate?.slice(0, 10)}</li>
                                                    <li><strong className="font-medium">Ngày ra viện:</strong> {record.dischargeDate?.slice(0, 10)}</li>
                                                    <li><strong className="font-medium">Trạng thái:</strong> {record.status}</li>
                                                    <li><strong className="font-medium">Mã đơn thuốc:</strong> {record.prescriptionCode || "Không có thông tin"}</li>
                                                    <li><strong className="font-medium">Đơn thuốc:</strong>
                                                        {record.prescription?.length > 0 ? (
                                                            <ul className="ml-4 list-disc">
                                                                {record.prescription.map((item, index) => (
                                                                    <li key={index}>
                                                                        Thuốc: {item.medicine?.name || "Không xác định"} - Số lượng: {item.quantity} - Ghi chú: {item.note || "Không có"}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            "Không có đơn thuốc"
                                                        )}
                                                    </li>
                                                    <li><strong className="font-medium">Dịch vụ:</strong>
                                                        {record.services?.length > 0 ? (
                                                            <ul className="ml-4 list-disc">
                                                                {record.services.map((service, index) => (
                                                                    <li key={index}>{service?.name || "Không xác định"}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            "Không có dịch vụ"
                                                        )}
                                                    </li>
                                                    <li><strong className="font-medium">Ngày tạo:</strong> {record.createdAt?.slice(0, 10)}</li>
                                                    <li><strong className="font-medium">Ngày cập nhật:</strong> {record.updatedAt?.slice(0, 10)}</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loadingSubmit}
                        className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        {loadingSubmit ? "Đang tạo..." : "Tạo hóa đơn"}
                    </button>
                </div>
            </form>

            {/* Message */}
            {message && (
                <div
                    className={`mt-6 p-5 rounded-lg shadow-md ${
                        message.toLowerCase().includes("lỗi")
                            ? "bg-red-50 border border-red-200 text-red-700"
                            : "bg-green-50 border border-green-200 text-green-700"
                    } transition-all duration-200`}
                >
                    <p className="font-medium">{message}</p>
                </div>
            )}
        </div>
    );
};

export default CreateInvoice2;