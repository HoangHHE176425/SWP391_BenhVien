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
  Tabs,
  Tab,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import "../../assets/css/CategoryManagement.css";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [openEditCategory, setOpenEditCategory] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openDeleteCategoryConfirm, setOpenDeleteCategoryConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || user.role !== "Staff") {
      navigate("/");
      return;
    }
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:9999/api/staff/categories", {
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

  const handleAddCategory = async () => {
    setLoading(true);
    try {
      if (!newCategory.name.trim()) {
        alert("Vui lòng nhập tên danh mục.");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        "http://localhost:9999/api/staff/categories",
        { name: newCategory.name },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories([...categories, response.data]);
      setNewCategory({ name: "" });
      setOpenAddCategory(false);
      setSuccessMessage("Thêm danh mục thành công!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert(
        "Thêm danh mục thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    setLoading(true);
    try {
      if (!editingCategory.name.trim()) {
        alert("Vui lòng nhập tên danh mục.");
        setLoading(false);
        return;
      }
      const response = await axios.put(
        `http://localhost:9999/api/staff/categories/${editingCategory._id}`,
        { name: editingCategory.name },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories(
        categories.map((category) =>
          category._id === editingCategory._id ? response.data : category
        )
      );
      setEditingCategory(null);
      setOpenEditCategory(false);
      setSuccessMessage("Cập nhật danh mục thành công!");
    } catch (error) {
      console.error("Error updating category:", error);
      alert(
        "Cập nhật danh mục thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:9999/api/staff/categories/${categoryToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCategories(
        categories.filter((category) => category._id !== categoryToDelete._id)
      );
      setOpenDeleteCategoryConfirm(false);
      setCategoryToDelete(null);
      setSuccessMessage("Xóa danh mục thành công!");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        "Xóa danh mục thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditCategory = (category) => {
    setEditingCategory({ _id: category._id, name: category.name });
    setOpenEditCategory(true);
  };

  const handleCloseEditCategory = () => {
    setOpenEditCategory(false);
    setEditingCategory(null);
  };

  const handleOpenAddCategory = () => {
    setOpenAddCategory(true);
  };

  const handleCloseAddCategory = () => {
    setOpenAddCategory(false);
    setNewCategory({ name: "" });
  };

  const handleOpenDeleteCategoryConfirm = (category) => {
    setCategoryToDelete(category);
    setOpenDeleteCategoryConfirm(true);
  };

  const handleCloseDeleteCategoryConfirm = () => {
    setOpenDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate("/staff/blogs");
    }
  };

  const handleCloseSuccess = () => {
    setSuccessMessage("");
  };

  return (
    <div className="category-list-page">
      <h1>Quản lý Danh mục</h1>
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
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpenAddCategory}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Thêm Danh mục
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="stt">STT</TableCell> {/* Thêm cột STT */}
              <TableCell>Tên</TableCell>
              <TableCell className="actions">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category._id}>
                <TableCell className="stt">{index + 1}</TableCell> {/* Hiển thị STT */}
                <TableCell>{category.name}</TableCell>
                <TableCell className="actions">
                  <Button
                    color="primary"
                    onClick={() => handleOpenEditCategory(category)}
                    startIcon={<EditIcon />}
                    disabled={loading}
                  />
                  <Button
                    color="secondary"
                    onClick={() => handleOpenDeleteCategoryConfirm(category)}
                    startIcon={<DeleteIcon />}
                    disabled={loading}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Edit Category Dialog */}
      <Dialog open={openEditCategory} onClose={handleCloseEditCategory}>
        <DialogTitle>Chỉnh sửa Danh mục</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên Danh mục"
            type="text"
            fullWidth
            value={editingCategory?.name || ""}
            onChange={(e) =>
              setEditingCategory({
                ...editingCategory,
                name: e.target.value,
              })
            }
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEditCategory}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdateCategory}
            color="primary"
            disabled={loading}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Category Dialog */}
      <Dialog open={openAddCategory} onClose={handleCloseAddCategory}>
        <DialogTitle>Thêm Danh mục</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên Danh mục"
            type="text"
            fullWidth
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseAddCategory}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAddCategory}
            color="primary"
            disabled={loading}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Category Confirm Dialog */}
      <Dialog
        open={openDeleteCategoryConfirm}
        onClose={handleCloseDeleteCategoryConfirm}
      >
        <DialogTitle>Xóa Danh mục</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa danh mục này không? Thao tác này sẽ xóa liên kết của danh mục với các bài viết.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteCategoryConfirm}
            color="primary"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteCategory}
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

export default CategoryManagement;