import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceList = ({ onSelectDetail, onEditService }) => {
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const limit = 5;

    const fetchServices = async () => {
        try {
            const res = await axios.get('http://localhost:9999/api/receptionist/services', {
                params: { page, limit, search },
            });
            if (res.data.success) {
                setServices(res.data.services);
                setTotalPages(res.data.pagination.pages);
                setError(null);
            } else {
                throw new Error(res.data.message || 'Failed to fetch services');
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách:', err.message);
            setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
            setServices([]);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [search, page]);

    // Generate page numbers for pagination
    const renderPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`page-btn ${i === page ? 'active' : ''}`}
                    onClick={() => setPage(i)}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="service-list-container">
            <style>{`
        .service-list-container {
          max-width: 900px;
          margin: 30px auto;
          padding: 20px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        h2 {
          text-align: center;
          margin-bottom: 25px;
          color: #2c3e50;
          font-size: 28px;
          font-weight: 600;
        }
        .search-box {
          position: relative;
          margin-bottom: 30px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .search-box input {
          width: 100%;
          padding: 12px 40px 12px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 25px;
          font-size: 16px;
          transition: border-color 0.3s, box-shadow 0.3s;
          background: #f9f9f9;
        }
        .search-box input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
        }
        .search-box::before {
          content: '🔍';
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        .service-item {
          display: grid;
          grid-template-columns: 2fr 3fr 1fr;
          align-items: center;
          padding: 20px;
          margin-bottom: 15px;
          background: #f7fafc;
          border-radius: 8px;
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid #edf2f7;
        }
        .service-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        }
        .service-item strong {
          font-size: 18px;
          color: #2d3748;
          font-weight: 500;
        }
        .service-item p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.5;
        }
        .service-item .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .service-item button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.3s, transform 0.2s;
        }
        .service-item button.detail-btn {
          background: #007bff;
          color: white;
        }
        .service-item button.detail-btn:hover {
          background: #0056b3;
          transform: scale(1.05);
        }
        .service-item button.edit-btn {
          background: #38a169;
          color: white;
        }
        .service-item button.edit-btn:hover {
          background: #2f855a;
          transform: scale(1.05);
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 30px;
        }
        .pagination button {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #ffffff;
          color: #2d3748;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s, color 0.3s;
        }
        .pagination button:disabled {
          background: #edf2f7;
          color: #a0aec0;
          cursor: not-allowed;
        }
        .pagination button:hover:not(:disabled) {
          background: #007bff;
          color: white;
        }
        .pagination .page-btn {
          min-width: 36px;
          text-align: center;
        }
        .pagination .page-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
          font-weight: 600;
        }
        .error-message {
          color: #e53e3e;
          text-align: center;
          margin: 20px 0;
          font-size: 16px;
        }
        .no-results {
          text-align: center;
          color: #718096;
          font-size: 16px;
          margin: 20px 0;
        }
        @media (max-width: 768px) {
          .service-item {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 15px;
          }
          .service-item .actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
          .service-item button {
            width: 100%;
            margin-top: 5px;
          }
          .search-box input {
            font-size: 14px;
          }
          .pagination button {
            padding: 6px 10px;
            font-size: 12px;
          }
        }
      `}</style>

            <h2>Danh sách Dịch vụ</h2>
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>
            {error && <div className="error-message">{error}</div>}
            {services.length === 0 && !error ? (
                <div className="no-results">Không tìm thấy dịch vụ nào.</div>
            ) : (
                services.map((service) => (
                    <div key={service._id} className="service-item">
                        <div>
                            <strong>{service.name}</strong>
                        </div>
                        <p>{service.description || 'Không có mô tả'}</p>
                        <div className="actions">
                            <button className="detail-btn" onClick={() => onSelectDetail(service._id)}>
                                Chi tiết
                            </button>
                            <button className="edit-btn" onClick={() => onEditService(service)}>
                                Sửa
                            </button>
                        </div>
                    </div>
                ))
            )}
            <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Trang trước
                </button>
                {renderPageNumbers()}
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Trang sau
                </button>
            </div>
        </div>
    );
};

export default ServiceList;