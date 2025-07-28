import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:9999/api/staff';

const CreateServicePage = () => {
    const [form, setForm] = useState({ name: '', description: '', price: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/create/services`, form);
            navigate('/staff/services');
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Lỗi khi tạo dịch vụ');
            }
            console.error(err);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Thêm Dịch vụ</h2>
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
                        placeholder="Mô tả ngắn về dịch vụ"
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
                        placeholder="Ví dụ: 150000"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
                    >
                        Tạo dịch vụ
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateServicePage;
