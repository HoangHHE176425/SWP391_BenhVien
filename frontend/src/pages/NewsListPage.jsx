import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import debounce from "lodash/debounce";
import "../assets/css/NewsListPage.css";

const NEWS_CATEGORIES = [
  "Thông Báo Nghỉ Lễ",
  "Khuyến Mãi",
  "Sự Kiện",
  "Cập Nhật Dịch Vụ",
  "Khác",
];
const API_BASE_URL = "http://localhost:9999/api/staff";

const NewsListPage = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [latestNewsItems, setLatestNewsItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLatestIndex, setCurrentLatestIndex] = useState(0);
  const newsPerPage = 8;
  const navigate = useNavigate();
  const carouselIntervalRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  const debouncedFetchData = useCallback(
    debounce(async (params, headers) => {
      try {
        setLoading(true);
        const [newsResponse, latestNewsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/news`, { params, headers }),
          axios.get(`${API_BASE_URL}/news`, {
            params: { limit: 3 },
            headers,
          }),
        ]);
        console.log("Filtered news response:", newsResponse.data);
        console.log("Latest news response:", latestNewsResponse.data);
        setNewsItems(newsResponse.data.data || []);
        setLatestNewsItems(latestNewsResponse.data.data || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        const message =
          error.response?.data?.message || "Không thể tải tin tức";
        if (error.response?.status === 401) {
          setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setErrorMessage(message);
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    [navigate]
  );

  useEffect(() => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    debouncedFetchData(
      {
        category: selectedCategory || undefined,
        title: searchQuery || undefined,
        page: currentPage,
        limit: newsPerPage,
      },
      headers
    );
  }, [currentPage, selectedCategory, searchQuery, debouncedFetchData]);

  useEffect(() => {
    if (currentPage !== 1) return;

    const startCarousel = () => {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentLatestIndex((prevIndex) => {
          const latestNewsLength = Math.min(latestNewsItems.length, 3);
          return (prevIndex + 1) % latestNewsLength;
        });
      }, 5000);
    };

    startCarousel();

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [currentPage, latestNewsItems]);

  const handlePrev = () => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
    setCurrentLatestIndex((prevIndex) => {
      const latestNewsLength = Math.min(latestNewsItems.length, 3);
      return (prevIndex - 1 + latestNewsLength) % latestNewsLength;
    });
    setTimeout(() => {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentLatestIndex((prevIndex) => {
          const latestNewsLength = Math.min(latestNewsItems.length, 3);
          return (prevIndex + 1) % latestNewsLength;
        });
      }, 5000);
    }, 10000);
  };

  const handleNext = () => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
    setCurrentLatestIndex((prevIndex) => {
      const latestNewsLength = Math.min(latestNewsItems.length, 3);
      return (prevIndex + 1) % latestNewsLength;
    });
    setTimeout(() => {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentLatestIndex((prevIndex) => {
          const latestNewsLength = Math.min(latestNewsItems.length, 3);
          return (prevIndex + 1) % latestNewsLength;
        });
      }, 5000);
    }, 10000);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseError = () => {
    setErrorMessage("");
  };

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength - 3) + "...";
  };

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

  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentListNews = newsItems.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(newsItems.length / newsPerPage);

  if (loading) {
    return (
      <Box
        className="newspage-loading"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 0 }}>
      {/* Hero Carousel */}
      <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img
              src="https://kientrucbenhvien.com/wp-content/uploads/2019/12/thiet-ke-noi-that-phong-kham-da-khoa-son-duong-04.jpg"
              className="d-block w-100"
              alt="KiwiCare Doctors Banner"
              style={{ objectFit: "cover", height: "80vh" }}
            />
            <div
              className="carousel-caption d-flex flex-column justify-content-center align-items-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
            >
              <div className="text-center text-white">
                <h1 className="display-3 fw-bold">News</h1>
                <p className="lead mt-3">Cập nhật những thông tin mới nhất của phòng khám</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Box className="newspage-page" sx={{ padding: 3 }}>
        <Box className="newspage-layout">
          <Box className="newspage-content-main" sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Lọc theo danh mục</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tất cả danh mục</em>
                  </MenuItem>
                  {NEWS_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Tìm kiếm theo tiêu đề"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
            </Box>

            {currentPage === 1 && latestNewsItems.length > 0 && (
              <section className="newspage-latest-news">
                <Typography variant="h5" className="newspage-section-title">
                  Tin tức mới nhất
                </Typography>
                <Box className="newspage-latest-news-carousel">
                  <Button
                    className="newspage-carousel-btn prev"
                    onClick={handlePrev}
                    disabled={latestNewsItems.length <= 1}
                    aria-label="Tin tức trước"
                  >
                    
                  </Button>
                  <Box
                    className="newspage-latest-news-wrapper"
                    sx={{
                      transform: `translateX(-${currentLatestIndex * 100}%)`,
                    }}
                  >
                    {latestNewsItems.map((news) => (
                      <Box key={news._id} className="newspage-latest-news-card">
                        <Box className="newspage-news-image">
                          <Link to={`/news/${news.slug}`}>
                            <img
                              src={
                                news.thumbnail ||
                                "https://via.placeholder.com/1200x400"
                              }
                              alt={news.title}
                              className="newspage-latest-news-image"
                              onError={(e) =>
                                (e.target.src =
                                  "https://via.placeholder.com/1200x400")
                              }
                            />
                          </Link>
                        </Box>
                        <Box className="newspage-news-content">
                          <Typography
                            className="newspage-news-category"
                            sx={{
                              backgroundColor: getCategoryColor(news.category),
                            }}
                          >
                            {news.category}
                          </Typography>
                          <Link
                            to={`/news/${news.slug}`}
                            className="newspage-news-title-link"
                          >
                            <Typography className="newspage-news-title">
                              {truncateText(news.title, 60)}
                            </Typography>
                          </Link>
                          <Typography className="newspage-news-excerpt">
                            {truncateText(news.content, 50)}
                          </Typography>
                          <Link
                            to={`/news/${news.slug}`}
                            className="newspage-read-more"
                          >
                            Chi tiết
                          </Link>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    className="newspage-carousel-btn next"
                    onClick={handleNext}
                    disabled={latestNewsItems.length <= 1}
                    aria-label="Tin tức tiếp theo"
                  >
                    
                  </Button>
                </Box>
              </section>
            )}

            <section className="newspage-list-news">
              <Typography variant="h5" className="newspage-section-title">
                Tất cả các tin tức
              </Typography>
              <Box className="newspage-category-filter">
                <Button
                  className={`newspage-category-btn ${
                    selectedCategory === "" ? "active" : ""
                  }`}
                  onClick={() => handleCategorySelect("")}
                >
                  Tất cả bài viết
                </Button>
                {NEWS_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    className={`newspage-category-btn ${
                      selectedCategory === category ? "active" : ""
                    }`}
                    sx={{ backgroundColor: getCategoryColor(category) }}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Button>
                ))}
              </Box>
              <Box className="newspage-list-grid">
                {currentListNews.map((news) => (
                  <Box key={news._id} className="newspage-item">
                    <Box className="newspage-news-image">
                      <Link to={`/news/${news.slug}`}>
                        <img
                          src={
                            news.thumbnail ||
                            "https://via.placeholder.com/260x160"
                          }
                          alt={news.title}
                          className="newspage-list-news-image"
                          onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/260x160")
                          }
                        />
                      </Link>
                    </Box>
                    <Box className="newspage-news-content">
                      <Link
                        to={`/news/${news.slug}`}
                        className="newspage-news-title-link"
                      >
                        <Typography className="newspage-news-title">
                          {truncateText(news.title, 50)}
                        </Typography>
                      </Link>
                      <Typography className="newspage-news-excerpt">
                        {truncateText(news.content, 50)}
                      </Typography>
                      <Link
                        to={`/news/${news.slug}`}
                        className="newspage-read-more"
                      >
                        Chi tiết
                      </Link>
                    </Box>
                  </Box>
                ))}
              </Box>
              {totalPages > 1 && (
                <Box className="newspage-pagination">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="newspage-pagination-btn"
                    aria-label="Trang trước"
                  >
                    
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <Button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`newspage-pagination-btn ${
                          currentPage === number ? "active" : ""
                        }`}
                        aria-label={`Trang ${number}`}
                      >
                        {number}
                      </Button>
                    )
                  )}
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="newspage-pagination-btn"
                    aria-label="Trang tiếp theo"
                  >
                    
                  </Button>
                </Box>
              )}
            </section>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewsListPage;