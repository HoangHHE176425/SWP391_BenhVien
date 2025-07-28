import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const CreateInvoice2 = () => {
    const [userId, setUserId] = useState("");
    const [profiles, setProfiles] = useState([]);
    const [profileId, setProfileId] = useState("");
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [realuserId, setRealUserId] = useState("");
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [message, setMessage] = useState("");

    // New state for search and filter
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name"); // name, price-asc, price-desc
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

    // Load services on mount
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:9999/api/staff/abc/services", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setServices(res.data.services || []);
            } catch (error) {
                console.error("Lỗi tải dịch vụ:", error);
            }
        };
        fetchServices();
    }, []);

    // Khi userId thay đổi, gọi API lấy profiles
    useEffect(() => {
        if (!userId.trim()) {
            setProfiles([]);
            setProfileId("");
            return;
        }
        const fetchProfiles = async () => {
            setLoadingProfiles(true);
            try {
                const token = localStorage.getItem("token");

                const res = await axios.get(
                    `http://localhost:9999/api/appointmentScheduleManagement/profile/${userId.trim()}`, /// cccd chu ko phai userId ( viet vay cho de debug )
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setProfiles(res.data.profiles || []);
                setRealUserId(res.data.uid);
                setProfileId(""); // reset profile chọn
            } catch (error) {
                console.error("Lỗi tải profiles:", error);
                setProfiles([]);
                setProfileId("");
            } finally {
                setLoadingProfiles(false);
            }
        };
        fetchProfiles();
    }, [userId]);

    // Filtered and sorted services
    const filteredServices = useMemo(() => {
        let filtered = services.filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (showSelectedOnly) {
            filtered = filtered.filter(service => selectedServices.includes(service._id));
        }

        // Sort services
filtered.sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                    return a.price - b.price;
                case "price-desc":
                    return b.price - a.price;
                case "name":
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [services, searchTerm, sortBy, showSelectedOnly, selectedServices]);
    console.log(realuserId);
    // Calculate total price
    const totalPrice = useMemo(() => {
        return services
            .filter(service => selectedServices.includes(service._id))
            .reduce((sum, service) => sum + service.price, 0);
    }, [services, selectedServices]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (selectedServices.length === 0) {
            setMessage("Vui lòng chọn ít nhất một dịch vụ");
            return;
        }

        // Nếu userId có nhập thì profileId là bắt buộc
        if (userId.trim() && !profileId) {
            setMessage("Vui lòng chọn profile tương ứng với userId đã nhập");
            return;
        }


        const payload = {
            // realId: realuserId || undefined,
            // userId: userId.trim() || undefined, /// cccd   
            userId: realuserId.trim() || undefined,
            profileId: profileId || undefined,  /// 1 dong profile
            ArrayServiceId: selectedServices,
        };

        setLoadingSubmit(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:9999/api/staff/invoices",
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessage(res.data.message || "Tạo hóa đơn thành công!");
            // Reset form
            setUserId("");
            setProfiles([]);
            setProfileId("");
            setSelectedServices([]);
            setSearchTerm("");
            setSortBy("name");
            setShowSelectedOnly(false);
        } catch (error) {
            console.error("Lỗi tạo hóa đơn:", error);
            setMessage(error.response?.data?.message || "Lỗi server");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleServiceToggle = (serviceId) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const selectAllServices = () => {
        const allServiceIds = filteredServices.map(service => service._id);
        setSelectedServices(allServiceIds);
    };

    const clearAllServices = () => {
        setSelectedServices([]);
    };

    return (
<div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Tạo hóa đơn mới</h2>
                <p className="text-gray-600">Nhập thông tin khách hàng và chọn dịch vụ để tạo hóa đơn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information Section */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Thông tin khách hàng</h3>

                    {/* UserId input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nhập CCCD
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập số CCCD của khách hàng"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Profile select */}
                    {userId.trim() && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {loadingProfiles ? "Đang tải profiles..." : "Chọn Profile"}
                            </label>
                            <select
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={loadingProfiles || profiles.length === 0}
                                required
                            >
                                <option value="">-- Chọn profile --</option>
                                {profiles.map((profile) => (
                                    <option key={profile._id} value={profile._id}>
                                        {profile.name}
                                    </option>
                                ))}
                            </select>
                            {!loadingProfiles && profiles.length === 0 && (
                                <p className="text-red-500 mt-2 text-sm">
                                    Không tìm thấy profile nào cho userId này.
                                </p>
                            )}
                        </div>
                    )}
                </div>
{/* Services Section */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Chọn dịch vụ</h3>
                        <div className="text-sm text-gray-600">
                            Đã chọn: <span className="font-medium text-blue-600">{selectedServices.length}</span> dịch vụ
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tìm kiếm dịch vụ
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập tên dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sắp xếp theo
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="name">Tên A-Z</option>
                                <option value="price-asc">Giá tăng dần</option>
                                <option value="price-desc">Giá giảm dần</option>
                            </select>
                        </div>

                        {/* Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hiển thị
                            </label>
                            <label className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    checked={showSelectedOnly}
                                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                                    className="mr-2"
                                />
<span className="text-sm text-gray-600">Chỉ hiện đã chọn</span>
                            </label>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Thao tác nhanh
                            </label>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={selectAllServices}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    Chọn tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAllServices}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    Bỏ chọn
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <div
                                    key={service._id}
                                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedServices.includes(service._id)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    onClick={() => handleServiceToggle(service._id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 mb-1">
                                                {service.name}
                                            </h4>
                                            <p className="text-lg font-semibold text-blue-600">
                                                {service.price.toLocaleString("vi-VN")} VNĐ
                                            </p>
                                        </div>
                                        <input
type="checkbox"
                                            checked={selectedServices.includes(service._id)}
                                            onChange={() => handleServiceToggle(service._id)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 py-8">
                                {searchTerm ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào'}
                            </div>
                        )}
                    </div>

                    {/* Total Price */}
                    {selectedServices.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-gray-800">
                                    Tổng tiền ({selectedServices.length} dịch vụ):
                                </span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {totalPrice.toLocaleString("vi-VN")} VNĐ
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loadingSubmit}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loadingSubmit ? "Đang tạo..." : "Tạo hóa đơn"}
                    </button>
                </div>
            </form>

            {/* Message */}
            {message && (
                <div className={`mt-6 p-4 rounded-lg ${message.toLowerCase().includes("lỗi")
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-green-50 border border-green-200 text-green-700"
                    }`}>
                    <p className="font-medium">{message}</p>
                </div>
            )}
        </div>
    );
};

export default CreateInvoice2;