import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "../../src/assets/css/NewsDetail.css";

const NewsDetail = () => {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [prioritizedNews, setPrioritizedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced truncate function to handle emojis and special characters
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    // Find the last space or newline before maxLength
    let lastSpace = text.substring(0, maxLength).lastIndexOf(" ");
    let lastNewline = text.substring(0, maxLength).lastIndexOf("\n");
    let cutOff = Math.max(lastSpace, lastNewline);
    // If no space or newline found, cut at maxLength
    cutOff = cutOff > 0 ? cutOff : maxLength;
    // Ensure we don't split an emoji (check for surrogate pairs)
    while (cutOff > 0 && /[\uD800-\uDFFF]/.test(text[cutOff - 1])) {
      cutOff--;
    }
    return text.substring(0, cutOff) + "...";
  };

  // Get content summary for sidebar
  const getContentSummary = (content) => {
    return truncateText(content, 50);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch news detail, increment views, and fetch prioritized news
        const [newsResponse, viewsResponse, prioritizedNewsResponse] = await Promise.all([
          axios.get(`http://localhost:9999/api/staff/news/slug/${slug}`, { headers }),
          axios.post(`http://localhost:9999/api/staff/news/slug/${slug}/views`, {}, { headers }), // Increment views
          axios.get(`http://localhost:9999/api/staff/news/priority`, { headers }), // Fetch prioritized news
        ]);

        // Process news detail
        const newsData = newsResponse.data.data || newsResponse.data;
        if (!newsData) throw new Error("Dữ liệu tin tức không hợp lệ");
        setNews({
          ...newsData,
          content: newsData.content || "Không có nội dung.",
        });

        // Process prioritized news
        setPrioritizedNews(prioritizedNewsResponse.data.data || []);

        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        console.log("Phản hồi:", err.response?.data);
        console.log("Trạng thái:", err.response?.status);
        setError(
          err.response?.data?.message ||
            "Không thể tải tin tức hoặc bài viết ưu tiên. Vui lòng kiểm tra slug hoặc API."
        );
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div className="newsdetail-loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="newsdetail-error">Lỗi: {error}</div>;
  }

  if (!news) {
    return (
      <div className="newsdetail-error">
        Không tìm thấy tin tức hoặc tải thất bại. Vui lòng kiểm tra console.
      </div>
    );
  }

  return (
    <div className="newsdetail-page">
      <div className="newsdetail-wrapper">
        <div className="newsdetail-main">
          <div className="newsdetail-container">
            <div className="newsdetail-card">
              <div className="newsdetail-header">
                <h1 className="newsdetail-title">{news.title}</h1>
                <div className="newsdetail-meta">
                </div>
              </div>
              {news.image && (
                <img
                  src={news.image}
                  alt={news.title}
                  className="content-image"
                  onError={(e) => (e.target.src = "https://via.placeholder.com/800x400")}
                />
              )}
              <div className="newsdetail-content">
                <p className="content">{news.content}</p>
                <div className="newsdetail-meta-details">
                  <p><strong>Danh mục:</strong> {news.category}</p>
                  <p><strong>Hiệu lực đến:</strong> {news.validUntil ? new Date(news.validUntil).toLocaleDateString("vi-VN") : "Không áp dụng"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="newsdetail-sidebar">
          <h3 className="newsdetail-sidebar-title">Tin tức nổi bật</h3>
          <div className="newsdetail-featured-posts">
            {prioritizedNews.length > 0 ? (
              prioritizedNews.map((topNews, index) => (
                <div key={index} className="newsdetail-featured-post-card">
                  <Link to={`/news/${topNews.slug}`}>
                    <img
                      src={topNews.thumbnail || "https://via.placeholder.com/100x100"}
                      alt={topNews.title}
                      className="newsdetail-featured-post-image"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/100x100")}
                    />
                  </Link>
                  <div className="newsdetail-featured-post-content">
                    <Link
                      to={`/news/${topNews.slug}`}
                      className="newsdetail-featured-post-title-link"
                    >
                      <h4 className="newsdetail-featured-post-title">
                        {truncateText(topNews.title, 20)}
                      </h4>
                    </Link>
                    <p className="newsdetail-featured-post-excerpt">
                      {getContentSummary(topNews.content)}
                    </p>
                    <Link
                      to={`/news/${topNews.slug}`}
                      className="newsdetail-read-more"
                    >
                      Đọc bài viết
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p>Không có bài viết nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category color function (optional, kept for consistency)
const getCategoryColor = (categoryName) => {
  const colors = {
    "Thông Báo Nghỉ Lễ": "#ffcccc",
    "Khuyến Mãi": "#e6ccff",
    "Sự Kiện": "#cce0ff",
    "Cập Nhật Dịch Vụ": "#ccffcc",
    "Khác": "#e0e0e0",
  };
  return colors[categoryName] || "#e0e0e0";
};

export default NewsDetail;