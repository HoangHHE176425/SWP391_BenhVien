import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, HelpCircle, Sparkles, ChevronDown, ChevronUp, MessageCircle, FileText, Eye, EyeOff } from 'lucide-react';

const FAQList = () => {
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [titleFilter, setTitleFilter] = useState('');
  const [messageFilter, setMessageFilter] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 5;

  const fetchFAQs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:9999/api/user/faqs', {
        params: {
          // title: titleFilter,
          // message: messageFilter,
          sort,
          page,
          limit,
        },
      });

      setFaqs(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Lỗi khi tải danh sách FAQ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [titleFilter, messageFilter, sort, page]);

  const toggleExpand = (faqId) => {
    setExpanded(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };
  const filteredData = faqs.filter(item =>
  item.title.toLowerCase().includes(titleFilter.toLowerCase()) &&
  item.message.toLowerCase().includes(messageFilter.toLowerCase())
);

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPage = (pageNum) => {
    setPage(pageNum);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`w-12 h-12 rounded-xl font-bold transition-all duration-300 ${
            page === i
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            Câu hỏi thường gặp
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Khám phá các câu trả lời chi tiết cho những thắc mắc phổ biến nhất của bạn
          </p>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bộ lọc tìm kiếm nâng cao</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tìm kiếm theo chủ đề</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Nhập từ khóa chủ đề..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tìm kiếm theo câu hỏi</label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Tìm trong câu hỏi..."
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Sắp xếp theo</label>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white appearance-none cursor-pointer text-gray-800 font-medium"
                >
                  <option value="createdAt_desc">📅 Mới nhất trước</option>
                  <option value="createdAt_asc">📅 Cũ nhất trước</option>
                  <option value="title_asc">🔤 Tiêu đề A-Z</option>
                  <option value="title_desc">🔠 Tiêu đề Z-A</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* FAQ Table */}
        {!isLoading && (
          <>
            {faqs.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-8">
                  <HelpCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy kết quả</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto">
                  Thử điều chỉnh bộ lọc tìm kiếm để tìm FAQ phù hợp với nhu cầu của bạn
                </p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 overflow-hidden mb-12">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                      <tr>
                        <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5" />
                            Chủ đề
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="w-5 h-5" />
                            Câu hỏi
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" />
                            Trả lời
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5" />
                            Cập nhật
                          </div>
                        </th>
                        <th className="px-8 py-6 text-center text-sm font-bold text-white uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map((faq, index) => (
                        <React.Fragment key={faq._id}>
                          <tr 
                            className="hover:bg-blue-50/50 transition-all duration-300 group"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: 'fadeInUp 0.6s ease-out forwards'
                            }}
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex-shrink-0 mt-1">
                                  <HelpCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                                    {faq.title}
                                  </h3>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="max-w-xs">
                                {faq.message && faq.message.trim() !== '' ? (
                                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                                    {expanded[faq._id] ? faq.message : `${faq.message.substring(0, 100)}${faq.message.length > 100 ? '...' : ''}`}
                                  </p>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <p className="italic text-sm">Không có nội dung</p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="max-w-xs">
                                {faq.reply && faq.reply.trim() !== '' ? (
                                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                                    {expanded[faq._id] ? faq.reply : `${faq.reply.substring(0, 100)}${faq.reply.length > 100 ? '...' : ''}`}
                                  </p>
                                ) : (
                                  <div className="flex items-center gap-2 text-red-600">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <p className="italic text-sm">Chưa được trả lời</p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {new Date(faq.updatedAt).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <button
                                onClick={() => toggleExpand(faq._id)}
                                className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-110 shadow-lg"
                                title={expanded[faq._id] ? "Thu gọn" : "Xem chi tiết"}
                              >
                                {expanded[faq._id] ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Content Row */}
                          {expanded[faq._id] && (
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                              <td colSpan="5" className="px-8 py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  {/* Question Content */}
                                  <div className="bg-white rounded-2xl p-6 border-l-4 border-blue-500 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg">
                                        <MessageCircle className="w-4 h-4 text-white" />
                                      </div>
                                      <h4 className="text-lg font-bold text-blue-800">Câu hỏi chi tiết</h4>
                                    </div>
                                    {faq.message && faq.message.trim() !== '' ? (
                                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {faq.message}
                                      </p>
                                    ) : (
                                      <div className="flex items-center gap-3 text-amber-600">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <p className="italic">Không có nội dung câu hỏi chi tiết</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Answer Content */}
                                  <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-500 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-lg">
                                        <FileText className="w-4 h-4 text-white" />
                                      </div>
                                      <h4 className="text-lg font-bold text-emerald-800">Câu trả lời</h4>
                                    </div>
                                    {faq.reply && faq.reply.trim() !== '' ? (
                                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {faq.reply}
                                      </p>
                                    ) : (
                                      <div className="flex items-center gap-3 text-red-600">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <p className="italic">Câu hỏi này chưa được trả lời</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl font-bold text-gray-700 hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
                Trang trước
              </button>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <span className="text-lg text-gray-600 font-medium">
                  Trang <span className="font-bold text-blue-600">{page}</span> trong tổng số <span className="font-bold">{totalPages}</span>
                </span>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {renderPaginationButtons()}
                </div>
              </div>
              
              <button
                onClick={handleNext}
                disabled={page >= totalPages}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Trang sau
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default FAQList;