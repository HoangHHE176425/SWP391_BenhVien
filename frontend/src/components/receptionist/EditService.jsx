import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:9999/api/receptionist';

const EditServicePage = () => {
    const { id } = useParams();
    const [form, setForm] = useState({ name: '', description: '', price: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await axios.get(`${API}/get/services/${id}`);
                setForm(res.data.service);
                setLoading(false);
            } catch (err) {
                alert('Không tìm thấy dịch vụ');
                console.error(err);
                navigate('/receptionist/services');
            }
        };

        fetchService();
    }, [id, navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API}/update/services/${id}`, form);
            navigate('/receptionist/services');
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Lỗi khi cập nhật dịch vụ');
            }
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải dữ liệu...</div>;

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Chỉnh sửa Dịch vụ</h2>
            {error && <div className="mb-4 text-red-600 bg-red-100 px-4 py-2 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">Tên dịch vụ<span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập tên dịch vụ"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Mô tả</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Mô tả chi tiết về dịch vụ"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Giá (₫)<span className="text-red-500">*</span></label>
                    <input
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 200000"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditServicePage;
