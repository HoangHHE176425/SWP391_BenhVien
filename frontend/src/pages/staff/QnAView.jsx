import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  User, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Send, 
  Star,
  Bookmark,
  Loader2,
  FileText,
  Eye,
  Reply
} from 'lucide-react';

const QnAView = () => {
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("");
  // const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [replyMessages, setReplyMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
    const [titleFilter, setTitleFilter] = useState("");

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff/qa', {
        params: { sort, statusfilter: statusFilter, page, limit: 5 }
      });

      setQuestions(res.data.data);
      setTotalPages(res.data.totalPages);
      console.log(totalPages);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [sort, statusFilter, page]);
  const filteredData = questions.filter(q =>
    q.title.toLowerCase().includes(titleFilter.toLowerCase()) ||
    q.message?.toLowerCase().includes(titleFilter.toLowerCase())
  );
  const handleReply = async (id) => {
    const replyMessage = replyMessages[id];
    if (!replyMessage) return alert("Vui lòng nhập nội dung phản hồi.");

    try {
      await axios.put(`/api/staff/qa/${id}`, { replyMessage });
      alert("Phản hồi thành công!");
      setReplyMessages({ ...replyMessages, [id]: "" });
      fetchQuestions();
    } catch (error) {
      console.error("Lỗi khi phản hồi:", error);
      alert("OK.");
    }
  };

  const handleMarkAsFAQ = async (id) => {
    try {
      await axios.post(`/api/staff/qa/${id}/mark-as-faq`);
      alert("Đã đánh dấu thành FAQ thành công!");
      fetchQuestions();
    } catch (error) {
      console.error("Lỗi khi đánh dấu FAQ:", error);
      alert("Có lỗi xảy ra khi đánh dấu FAQ.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'answered':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'answered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          onClick={() => setPage(i)}
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
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            Quản lý Q&A
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Quản lý và phản hồi các câu hỏi từ người dùng một cách chuyên nghiệp
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tìm theo Chủ đề/Câu hỏi</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Nhập ..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white text-gray-800 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Trạng thái</label>
              <select
                onChange={(e) => setStatusFilter(e.target.value)}
                value={statusFilter}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white appearance-none cursor-pointer text-gray-800 font-medium"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">⏳ Chờ phản hồi</option>
                <option value="answered">✅ Đã phản hồi</option>
                <option value="closed">❌ Đã đóng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Sắp xếp theo</label>
              <select
                onChange={(e) => setSort(e.target.value)}
                value={sort}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white appearance-none cursor-pointer text-gray-800 font-medium"
              >
                <option value="">📅 Mới nhất</option>
                <option value="createdAt_asc">📅 Cũ nhất</option>
                <option value="createdAt_desc">📅 Mới nhất</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setPage(1)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                🔍 Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <p className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Questions List */}
        {!loading && (
          <>
            {questions.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-8">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy câu hỏi nào</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto">
                  Thử điều chỉnh bộ lọc tìm kiếm để tìm câu hỏi phù hợp
                </p>
              </div>
            ) : (
              <div className="space-y-6 mb-12">
                {filteredData.map((q, index) => (
                  <div
                    key={q._id}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl">
                            <MessageSquare className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{q.title}</h3>
                            <div className="flex items-center gap-4 text-blue-100">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm">ID: {q.userId || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{q.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(q.status)}`}>
                            {getStatusIcon(q.status)}
                            <span className="font-semibold text-sm capitalize">{q.status}</span>
                          </div>
                          <button
                            onClick={() => toggleExpand(q._id)}
                            className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all duration-300"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      {/* Question Content Preview */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-800">Nội dung câu hỏi:</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                          {expandedCards[q._id] ? q.message : `${q.message.substring(0, 150)}${q.message.length > 150 ? '...' : ''}`}
                        </p>
                      </div>

                      {/* Expanded Content */}
                      {expandedCards[q._id] && (
                        <div className="space-y-6 border-t border-gray-200 pt-6">
                          {/* Reply Section */}
                          {q.status === "pending" ? (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                              <div className="flex items-center gap-2 mb-4">
                                <Reply className="w-5 h-5 text-amber-600" />
                                <span className="font-semibold text-amber-800">Phản hồi câu hỏi</span>
                              </div>
                              <textarea
                                placeholder="Nhập nội dung phản hồi chi tiết..."
                                value={replyMessages[q._id] || ""}
                                onChange={(e) =>
                                  setReplyMessages({ ...replyMessages, [q._id]: e.target.value })
                                }
                                className="w-full p-4 border-2 border-amber-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 min-h-[120px] resize-none"
                              />
                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={() => handleReply(q._id)}
                                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                  <Send className="w-5 h-5" />
                                  Gửi phản hồi
                                </button>
                                <button
                                  onClick={() => handleMarkAsFAQ(q._id)}
                                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                  <Star className="w-5 h-5" />
                                  Đánh dấu FAQ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                              <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-emerald-800">Phản hồi đã gửi</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl mb-4">
                                {q.reply}
                              </p>
                              {q.repliedAt && (
                                <div className="flex items-center gap-2 text-emerald-700">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    Phản hồi lúc: {new Date(q.repliedAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              )}
                              <div className="mt-4">
                                <button
                                  onClick={() => handleMarkAsFAQ(q._id)}
                                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                  <Bookmark className="w-5 h-5" />
                                  Đánh dấu FAQ
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Tạo lúc: {new Date(q.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Cập nhật: {new Date(q.updatedAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
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
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
      `}</style>
    </div>
  );
};

export default QnAView;