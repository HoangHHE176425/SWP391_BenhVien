import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, AlertCircle, CheckCircle2, XCircle, Loader2, Stethoscope } from 'lucide-react';

const NutritionAdvice = () => {
    const [diseases, setDiseases] = useState([]);
    const [selectedDisease, setSelectedDisease] = useState('');
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy danh sách bệnh
    useEffect(() => {
        axios.get('/api/food/diseases')
            .then(res => setDiseases(res.data))
            .catch(() => setError("Không thể lấy danh sách bệnh"));
    }, []);

    // Lấy tư vấn khi chọn bệnh
    useEffect(() => {
        if (!selectedDisease) {
            setAdvice(null);
            return;
        }
        setLoading(true);
        setError(null);

        axios.get(`/api/food/nutrition-advice/${selectedDisease}`)
            .then(res => setAdvice(res.data))
            .catch(() => setError("Không tìm thấy thông tin dinh dưỡng"))
            .finally(() => setLoading(false));
    }, [selectedDisease]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-full">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                        Tư vấn dinh dưỡng chuyên nghiệp
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Hướng dẫn dinh dưỡng khoa học cho các bệnh phổ biến
                    </p>
                </div>

                {/* Disease Selection Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                    <div className="flex items-center mb-4">
                        <Stethoscope className="w-5 h-5 text-blue-600 mr-2" />
                        <label htmlFor="disease-select" className="text-lg font-semibold text-gray-800">
                            Chọn tình trạng sức khỏe:
                        </label>
                    </div>
                    <select
                        id="disease-select"
                        value={selectedDisease}
                        onChange={(e) => setSelectedDisease(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-700 
                                 bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none 
                                 transition-all duration-200 hover:border-gray-300"
                    >
                        <option value="">-- Vui lòng chọn tình trạng sức khỏe --</option>
                        {diseases.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                            <p className="text-lg text-gray-600">Đang phân tích và tìm kiếm thông tin dinh dưỡng...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center">
                            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Advice Content */}
                {advice && !loading && (
                    <div className="space-y-6">
                        {/* Should Eat Section */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
                                <div className="flex items-center">
                                    <CheckCircle2 className="w-6 h-6 text-white mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Thực phẩm nên sử dụng</h2>
                                </div>
                                <p className="text-green-100 mt-2">Các thực phẩm có lợi cho tình trạng sức khỏe của bạn</p>
                            </div>
                            <div className="p-6">
                                <div className="grid gap-4">
                                    {advice.shouldEat.map(({ food, explanation }, idx) => (
                                        <div key={idx} className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg
                                                               hover:bg-green-100 transition-colors duration-200">
                                            <div className="flex items-start">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h3 className="font-semibold text-green-800 text-lg mb-1">{food}</h3>
                                                    <p className="text-green-700 leading-relaxed">{explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Should Avoid Section */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6">
                                <div className="flex items-center">
                                    <XCircle className="w-6 h-6 text-white mr-3" />
                                    <h2 className="text-2xl font-bold text-white">Thực phẩm nên tránh</h2>
                                </div>
                                <p className="text-red-100 mt-2">Các thực phẩm có thể ảnh hưởng xấu đến tình trạng sức khỏe</p>
                            </div>
                            <div className="p-6">
                                <div className="grid gap-4">
                                    {advice.shouldAvoid.map(({ food, explanation }, idx) => (
                                        <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg
                                                               hover:bg-red-100 transition-colors duration-200">
                                            <div className="flex items-start">
                                                <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h3 className="font-semibold text-red-800 text-lg mb-1">{food}</h3>
                                                    <p className="text-red-700 leading-relaxed">{explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                            <div className="flex items-start">
                                <AlertCircle className="w-6 h-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-amber-800 mb-2">Lưu ý quan trọng</h3>
                                    <p className="text-amber-700 leading-relaxed">
                                        Thông tin này chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến bác sĩ
                                        hoặc chuyên gia dinh dưỡng trước khi thay đổi chế độ ăn uống.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NutritionAdvice;