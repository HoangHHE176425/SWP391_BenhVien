import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Box,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import "../../assets/css/BlogManagement.css";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: [
      {
        type: "paragraph",
        text: "",
        url: "",
        bold: false,
        italic: false,
        fontSize: "medium",
      },
    ],
    image: "",
    categoryId: "",
  });
  const [openEditBlog, setOpenEditBlog] = useState(false);
  const [openAddBlog, setOpenAddBlog] = useState(false);
  const [openDeleteBlogConfirm, setOpenDeleteBlogConfirm] = useState(false);
  const [imageFiles, setImageFiles] = useState({
    mainImage: null,
    contentImages: {},
  });
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const blogsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "Admin") {
      navigate("/");
      return;
    }
    fetchBlogs();
    fetchCategories();
  }, [navigate]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/receptionist/blogs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBlogs(response.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      alert(
        "Thất bại khi lấy danh sách bài viết: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/receptionist/categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert(
        "Thất bại khi lấy danh sách danh mục: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleUploadImages = async (files) => {
    const formData = new FormData();
    const totalImages =
      (files.mainImage ? 1 : 0) + Object.keys(files.contentImages).length;
    if (totalImages === 0) return [];
    if (totalImages > 10) {
      alert("Không thể tải lên quá 10 hình ảnh (hình ảnh chính + hình ảnh nội dung).");
      return [];
    }
    if (files.mainImage) formData.append("mainImage", files.mainImage);
    Object.values(files.contentImages).forEach((file) => {
      if (file) formData.append("contentImages", file);
    });
    try {
      const response = await axios.post(
        "http://localhost:9999/api/receptionist/blogs/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.urls || [];
    } catch (error) {
      console.error("Error uploading images:", error.response?.data || error);
      alert(
        "Tải hình ảnh thất bại: " +
        (error.response?.data?.message || error.message)
      );
      return [];
    }
  };

  const handleAddBlog = async () => {
    setLoading(true);
    try {
      let blogToAdd = { ...newBlog };
      if (!newBlog.title.trim()) {
        alert("Vui lòng nhập tiêu đề.");
        setLoading(false);
        return;
      }
      if (!newBlog.categoryId) {
        alert("Vui lòng chọn danh mục.");
        setLoading(false);
        return;
      }
      if (!newBlog.content.length) {
        alert("Vui lòng thêm ít nhất một nội dung.");
        setLoading(false);
        return;
      }
      const imageContentItems = newBlog.content.filter(
        (item) => item.type === "image"
      );
      const uploadedContentImages = Object.keys(
        imageFiles.contentImages
      ).length;
      if (
        imageContentItems.length > 0 ||
        uploadedContentImages > 0 ||
        imageFiles.mainImage
      ) {
        const uploadedUrls = await handleUploadImages(imageFiles);
        if (
          uploadedUrls.length === 0 &&
          (uploadedContentImages > 0 || imageFiles.mainImage)
        ) {
          alert("Tải hình ảnh thất bại. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
        let urlIndex = 0;
        if (imageFiles.mainImage && uploadedUrls.length > urlIndex) {
          blogToAdd.image = uploadedUrls[urlIndex++];
        }
        let contentImageIndices = Object.keys(imageFiles.contentImages).map(
          Number
        );
        blogToAdd.content = newBlog.content.map((item, index) => {
          if (item.type === "image" && contentImageIndices.includes(index)) {
            const newUrl = uploadedUrls[urlIndex++] || "";
            return { ...item, url: newUrl };
          }
          return item;
        });
      }
      const response = await axios.post(
        "http://localhost:9999/api/receptionist/blogs",
        {
          title: blogToAdd.title,
          content: blogToAdd.content,
          image: blogToAdd.image,
          categoryId: blogToAdd.categoryId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs([...blogs, response.data]);
      setNewBlog({
        title: "",
        content: [
          {
            type: "paragraph",
            text: "",
            url: "",
            bold: false,
            italic: false,
            fontSize: "medium",
          },
        ],
        image: "",
        categoryId: "",
      });
      setImageFiles({ mainImage: null, contentImages: {} });
      setOpenAddBlog(false);
      setSuccessMessage("Thêm bài viết thành công!");
      setPage(Math.ceil((blogs.length + 1) / blogsPerPage));
    } catch (error) {
      console.error("Error adding blog:", error.response?.data || error);
      alert(
        "Thêm bài viết thất bại: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    setLoading(true);
    try {
      let updatedBlog = { ...editingBlog };
      if (!updatedBlog.title.trim()) {
        alert("Vui lòng nhập tiêu đề.");
        setLoading(false);
        return;
      }
      if (!updatedBlog.categoryId) {
        alert("Vui lòng chọn danh mục.");
        setLoading(false);
        return;
      }
      if (!updatedBlog.content.length) {
        alert("Vui lòng thêm ít nhất một nội dung.");
        setLoading(false);
        return;
      }
      const imageContentItems = updatedBlog.content.filter(
        (item) => item.type === "image"
      );
      const uploadedContentImages = Object.keys(
        imageFiles.contentImages
      ).length;
      if (
        imageContentItems.length > 0 ||
        uploadedContentImages > 0 ||
        imageFiles.mainImage
      ) {
        const uploadedUrls = await handleUploadImages(imageFiles);
        if (
          uploadedUrls.length === 0 &&
          (uploadedContentImages > 0 || imageFiles.mainImage)
        ) {
          alert("Tải hình ảnh thất bại. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
        let urlIndex = 0;
        if (imageFiles.mainImage && uploadedUrls.length > urlIndex) {
          updatedBlog.image = uploadedUrls[urlIndex++];
        }
        let contentImageIndices = Object.keys(imageFiles.contentImages).map(
          Number
        );
        updatedBlog.content = updatedBlog.content.map((item, index) => {
          if (item.type === "image" && contentImageIndices.includes(index)) {
            const newUrl = uploadedUrls[urlIndex++] || item.url;
            return { ...item, url: newUrl };
          }
          return item;
        });
      }
      const response = await axios.put(
        `http://localhost:9999/api/receptionist/blogs/${editingBlog._id}`,
        {
          title: updatedBlog.title,
          content: updatedBlog.content,
          image: updatedBlog.image,
          categoryId: updatedBlog.categoryId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs(
        blogs.map((blog) =>
          blog._id === editingBlog._id ? response.data : blog
        )
      );
      setEditingBlog(null);
      setOpenEditBlog(false);
      setImageFiles({ mainImage: null, contentImages: {} });
      setSuccessMessage("Cập nhật bài viết thành công!");
    } catch (error) {
      console.error("Error updating blog:", error.response?.data || error);
      alert(
        "Cập nhật bài viết thất bại: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:9999/api/receptionist/blogs/${blogToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id));
      setOpenDeleteBlogConfirm(false);
      setBlogToDelete(null);
      setSuccessMessage("Xóa bài viết thành công!");
      if (filteredBlogs.length % blogsPerPage === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert(
        "Xóa bài viết thất bại: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditBlog = (blog) => {
    setEditingBlog({
      _id: blog._id,
      title: blog.title,
      content: blog.content || [
        {
          type: "paragraph",
          text: "",
          url: "",
          bold: false,
          italic: false,
          fontSize: "medium",
        },
      ],
      image: blog.image,
      categoryId: blog.categoryId?._id || blog.categoryId,
    });
    setOpenEditBlog(true);
  };

  const handleCloseEditBlog = () => {
    setOpenEditBlog(false);
    setEditingBlog(null);
    setImageFiles({ mainImage: null, contentImages: {} });
  };

  const handleOpenAddBlog = () => {
    setOpenAddBlog(true);
  };

  const handleCloseAddBlog = () => {
    setOpenAddBlog(false);
    setNewBlog({
      title: "",
      content: [
        {
          type: "paragraph",
          text: "",
          url: "",
          bold: false,
          italic: false,
          fontSize: "medium",
        },
      ],
      image: "",
      categoryId: "",
    });
    setImageFiles({ mainImage: null, contentImages: {} });
  };

  const handleOpenDeleteBlogConfirm = (blog) => {
    setBlogToDelete(blog);
    setOpenDeleteBlogConfirm(true);
  };

  const handleCloseDeleteBlogConfirm = () => {
    setOpenDeleteBlogConfirm(false);
    setBlogToDelete(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      navigate("/admin/category-management");
    }
  };

  const handleAddContentItem = (type) => {
    if (openEditBlog || openAddBlog) {
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: [
          ...prev.content,
          {
            type,
            text: "",
            url: "",
            bold: false,
            italic: false,
            fontSize: "medium",
          },
        ],
      }));
    }
  };

  const handleRemoveContentItem = (index) => {
    if (openEditBlog || openAddBlog) {
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: prev.content.filter((_, i) => i !== index),
      }));
      setImageFiles((prev) => {
        const newContentImages = { ...prev.contentImages };
        delete newContentImages[index];
        return { ...prev, contentImages: newContentImages };
      });
    }
  };

  const handleContentChange = (index, field, value) => {
    if (openEditBlog || openAddBlog) {
      const targetState = openEditBlog ? setEditingBlog : setNewBlog;
      targetState((prev) => ({
        ...prev,
        content: prev.content.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      }));
    }
  };

  const handleImageChange = (index, file) => {
    setImageFiles((prev) => ({
      ...prev,
      contentImages: { ...prev.contentImages, [index]: file },
    }));
  };

  const handleMainImageChange = (file) => {
    setImageFiles((prev) => ({ ...prev, mainImage: file }));
  };

  const handleCloseSuccess = () => {
    setSuccessMessage("");
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Filter and search blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      !filterCategory || blog.categoryId?._id === filterCategory;
    const matchesSearch =
      !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const paginatedBlogs = filteredBlogs.slice(
    (page - 1) * blogsPerPage,
    page * blogsPerPage
  );

  return (
    <div className="blog-list-page">
      <h1>Quản lý Bài viết</h1>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
        >
          <Tab label="Quản lý Bài viết" />
          <Tab label="Quản lý Danh mục" />
        </Tabs>
      </Box>
      <Box className="filter-search-container" sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl variant="outlined" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="filter-category-label">Lọc theo Danh mục</InputLabel>
          <Select
            labelId="filter-category-label"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Lọc theo Danh mục"
          >
            <MenuItem value="">
              <em>Tất cả Danh mục</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Tìm kiếm theo Tiêu đề"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          sx={{ flex: 1, minWidth: 200 }}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpenAddBlog}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Thêm Bài viết
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="stt">STT</TableCell>
              <TableCell className="title">Tiêu đề</TableCell>
              <TableCell className="content">Nội dung</TableCell>
              <TableCell>Hình ảnh</TableCell>
              <TableCell className="slug">Slug</TableCell>
              <TableCell className="actions">Hành động</TableCell>
            </TableRow>

          </TableHead>
          <TableBody>
            {paginatedBlogs.map((blog, index) => {
              const categoryIdValue =
                blog.categoryId?._id || blog.categoryId;
              const categoryName =
                blog.categoryId?.name ||
                categories.find((cat) => cat._id === categoryIdValue)
                  ?.name ||
                "N/A";
              // Tính số thứ tự dựa trên page và index
              const stt = (page - 1) * blogsPerPage + index + 1;
              return (
                <TableRow key={blog._id}>
                  <TableCell className="stt">{stt}</TableCell> {/* Hiển thị STT */}
                  <TableCell className="title">{blog.title}</TableCell>
                  <TableCell className="content">
                    {blog.content
                      ?.map(
                        (item) =>
                          `${item.type}: ${item.text || item.url || "N/A"}`
                      )
                      .join(", ") || "N/A"}
                  </TableCell>
                  <TableCell>
                    {blog.image && (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        style={{ width: "50px" }}
                      />
                    )}
                  </TableCell>
                  <TableCell className="category">{categoryName}</TableCell>
                  <TableCell className="slug">{blog.slug}</TableCell>
                  <TableCell className="actions">
                    <Button
                      color="primary"
                      onClick={() => handleOpenEditBlog(blog)}
                      startIcon={<EditIcon />}
                      disabled={loading}
                    />
                    <Button
                      color="secondary"
                      onClick={() => handleOpenDeleteBlogConfirm(blog)}
                      startIcon={<DeleteIcon />}
                      disabled={loading}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        count={Math.ceil(filteredBlogs.length / blogsPerPage)}
        page={page}
        onChange={handlePageChange}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />
      {/* Edit Blog Dialog */}
      <Dialog
        open={openEditBlog}
        onClose={handleCloseEditBlog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa Bài viết</DialogTitle>
        <DialogContent>
          {loading && (
            <div className="custom-loading-overlay">
              <CircularProgress />
            </div>
          )}
          <Box sx={{ mb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Tiêu đề"
              type="text"
              fullWidth
              value={editingBlog?.title || ""}
              onChange={(e) =>
                setEditingBlog({ ...editingBlog, title: e.target.value })
              }
              variant="outlined"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            {editingBlog?.content?.map((item, index) => (
              <Box
                key={index}
                className="custom-edit-section"
                sx={{ mb: 2, p: 2, borderRadius: 4 }}
              >
                <FormControl fullWidth margin="dense" variant="outlined">
                  <InputLabel id={`edit-content-type-${index}`}>Loại</InputLabel>
                  <Select
                    labelId={`edit-content-type-${index}`}
                    value={item.type}
                    onChange={(e) =>
                      handleContentChange(index, "type", e.target.value)
                    }
                    label="Loại"
                  >
                    <MenuItem value="paragraph">Đoạn văn</MenuItem>
                    <MenuItem value="bullet">Có chấm câu đầu dòng</MenuItem>
                    <MenuItem value="image">Hình ảnh</MenuItem>
                  </Select>
                </FormControl>
                {item.type !== "image" ? (
                  <>
                    <TextField
                      margin="dense"
                      label="Nội dung"
                      type="text"
                      fullWidth
                      value={item.text || ""}
                      onChange={(e) =>
                        handleContentChange(index, "text", e.target.value)
                      }
                      sx={{ mt: 1 }}
                      variant="outlined"
                    />
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.bold || false}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "bold",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Đậm"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.italic || false}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "italic",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Nghiêng"
                      />
                    </Box>
                    <FormControl fullWidth margin="dense" sx={{ mt: 1 }} variant="outlined">
                      <InputLabel id={`edit-font-size-${index}`}>Kích thước chữ</InputLabel>
                      <Select
                        labelId={`edit-font-size-${index}`}
                        value={item.fontSize || "medium"}
                        onChange={(e) =>
                          handleContentChange(
                            index,
                            "fontSize",
                            e.target.value
                          )
                        }
                        label="Kích thước chữ"
                      >
                        <MenuItem value="small">Nhỏ</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="large">Lớn</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) =>
                        handleImageChange(index, e.target.files[0])
                      }
                    />
                    {item.url && (
                      <img
                        src={item.url}
                        alt={`Hình ảnh ${index}`}
                        style={{ width: "100px", marginTop: "10px" }}
                      />
                    )}
                  </Box>
                )}
                <IconButton
                  color="secondary"
                  onClick={() => handleRemoveContentItem(index)}
                  sx={{ mt: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => handleAddContentItem("paragraph")}
                  sx={{ mt: 1, ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="edit-category-label">Danh mục</InputLabel>
              <Select
                labelId="edit-category-label"
                value={editingBlog?.categoryId || ""}
                onChange={(e) =>
                  setEditingBlog({
                    ...editingBlog,
                    categoryId: e.target.value,
                  })
                }
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleMainImageChange(e.target.files[0])}
              disabled={loading}
            />
            {editingBlog?.image && (
              <img
                src={editingBlog.image}
                alt="Hình ảnh chính"
                style={{ width: "100px", marginTop: "10px" }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEditBlog}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdateBlog}
            color="primary"
            disabled={loading}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Blog Dialog */}
      <Dialog
        open={openAddBlog}
        onClose={handleCloseAddBlog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm Bài viết</DialogTitle>
        <DialogContent>
          {loading && (
            <div className="custom-loading-overlay">
              <CircularProgress />
            </div>
          )}
          <Box sx={{ mb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Tiêu đề"
              type="text"
              fullWidth
              value={newBlog.title}
              onChange={(e) =>
                setNewBlog({ ...newBlog, title: e.target.value })
              }
              variant="outlined"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            {newBlog.content.map((item, index) => (
              <Box
                key={index}
                className="custom-edit-section"
                sx={{ mb: 2, p: 2, borderRadius: 4 }}
              >
                <FormControl fullWidth margin="dense" variant="outlined">
                  <InputLabel id={`add-content-type-${index}`}>Loại</InputLabel>
                  <Select
                    labelId={`add-content-type-${index}`}
                    value={item.type}
                    onChange={(e) =>
                      handleContentChange(index, "type", e.target.value)
                    }
                    label="Loại"
                  >
                    <MenuItem value="paragraph">Đoạn văn</MenuItem>
                    <MenuItem value="bullet">Có chấm câu đầu dòng</MenuItem>
                    <MenuItem value="image">Hình ảnh</MenuItem>
                  </Select>
                </FormControl>
                {item.type !== "image" ? (
                  <>
                    <TextField
                      margin="dense"
                      label="Nội dung"
                      type="text"
                      fullWidth
                      value={item.text || ""}
                      onChange={(e) =>
                        handleContentChange(index, "text", e.target.value)
                      }
                      sx={{ mt: 1 }}
                      variant="outlined"
                    />
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.bold || false}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "bold",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Đậm"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.italic || false}
                            onChange={(e) =>
                              handleContentChange(
                                index,
                                "italic",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Nghiêng"
                      />
                    </Box>
                    <FormControl fullWidth margin="dense" sx={{ mt: 1 }} variant="outlined">
                      <InputLabel id={`add-font-size-${index}`}>Kích thước chữ</InputLabel>
                      <Select
                        labelId={`add-font-size-${index}`}
                        value={item.fontSize || "medium"}
                        onChange={(e) =>
                          handleContentChange(
                            index,
                            "fontSize",
                            e.target.value
                          )
                        }
                        label="Kích thước chữ"
                      >
                        <MenuItem value="small">Nhỏ</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="large">Lớn</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) =>
                        handleImageChange(index, e.target.files[0])
                      }
                    />
                    {item.url && (
                      <img
                        src={item.url}
                        alt={`Hình ảnh ${index}`}
                        style={{ width: "100px", marginTop: "10px" }}
                      />
                    )}
                  </Box>
                )}
                <IconButton
                  color="secondary"
                  onClick={() => handleRemoveContentItem(index)}
                  sx={{ mt: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => handleAddContentItem("paragraph")}
                  sx={{ mt: 1, ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="add-category-label">Danh mục</InputLabel>
              <Select
                labelId="add-category-label"
                value={newBlog.categoryId}
                onChange={(e) =>
                  setNewBlog({ ...newBlog, categoryId: e.target.value })
                }
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleMainImageChange(e.target.files[0])}
              disabled={loading}
            />
            {newBlog.image && (
              <img
                src={newBlog.image}
                alt="Hình ảnh chính"
                style={{ width: "100px", marginTop: "10px" }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseAddBlog}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAddBlog}
            color="primary"
            disabled={loading}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Blog Confirm Dialog */}
      <Dialog
        open={openDeleteBlogConfirm}
        onClose={handleCloseDeleteBlogConfirm}
      >
        <DialogTitle>Xóa Bài viết</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa bài viết này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteBlogConfirm}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteBlog}
            color="secondary"
            disabled={loading}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BlogManagement;