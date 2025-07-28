import React, { useEffect, useState } from "react";
import axiosInstance from "../../../axiosInstance";
import "../../assets/css/MedicineManagement.css";
import MedicineTable from "../../components/staff/MedicineTable";
import MedicineSearchBar from "../../components/staff/MedicineSearchBar";
import MedicineFormModal from "../../components/staff/MedicineFormModal";

const EMPTY_MEDICINE = {
  name: "",
  type: "",
  group: "",
  ingredient: "",
  indication: "",
  contraindication: "",
  dosage: "",
  sideEffects: "",
  precaution: "",
  interaction: "",
  note: "",
  storage: "",
  quantity: "",
  unitPrice: "",
  expirationDate: "",
};

const axios = axiosInstance;

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [medicinesPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await axios.get(`/api/staff/medicinesall?page=${currentPage}&limit=${medicinesPerPage}&searchTerm=${searchTerm}`);
        console.log("API Response:", res.data);
        if (Array.isArray(res.data.medicines)) {
          setMedicines(res.data.medicines);
          setTotalMedicines(res.data.totalMedicines);  // Tổng số thuốc
        } else {
          setMedicines([]);
        }
      } catch (error) {
        setMedicines([]);
        console.error("Error fetching medicine details:", error);
      }
    };

    fetchMedicines();
  }, [currentPage, searchTerm]); // Khi currentPage thay đổi, sẽ gọi lại API

  useEffect(() => {
    // khi searchTerm thay đổi, về lại trang đầu
    setCurrentPage(1);
  }, [searchTerm]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(totalMedicines / medicinesPerPage);

  // Handle chuyển trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAdd = () => {
    setEditMedicine(null);
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setEditMedicine(medicine);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xác nhận xoá thuốc này?")) {
      try {
        await axios.delete(`/api/staff/medicines/${id}`);
        // Sau khi xóa, gọi lại fetch để cập nhật dữ liệu và phân trang
        const fetchAfterDelete = async () => {
          try {
            const res = await axios.get(`/api/staff/medicinesall?page=${currentPage}&limit=${medicinesPerPage}&searchTerm=${searchTerm}`);
            console.log("API Response after delete:", res.data);
            if (Array.isArray(res.data.medicines)) {
              setMedicines(res.data.medicines);
              setTotalMedicines(res.data.totalMedicines);
            } else {
              setMedicines([]);
            }
          } catch (error) {
            setMedicines([]);
            console.error("Error fetching after delete:", error);
          }
        };
        fetchAfterDelete();
      } catch (error) {
        console.error("Error deleting medicine:", error);
      }
    }
  };

  const handleSubmit = async (form) => {
    try {
      if (editMedicine) {
        await axios.put(`/api/staff/medicines/${editMedicine._id}`, form);
      } else {
        await axios.post(`/api/staff/medicines`, form);
      }
      setShowModal(false);
      // Sau khi submit, gọi lại fetch để cập nhật dữ liệu
      const fetchAfterSubmit = async () => {
        try {
          const res = await axios.get(`/api/staff/medicinesall?page=${currentPage}&limit=${medicinesPerPage}&searchTerm=${searchTerm}`);
          console.log("API Response after submit:", res.data);
          if (Array.isArray(res.data.medicines)) {
            setMedicines(res.data.medicines);
            setTotalMedicines(res.data.totalMedicines);
          } else {
            setMedicines([]);
          }
        } catch (error) {
          setMedicines([]);
          console.error("Error fetching after submit:", error);
        }
      };
      fetchAfterSubmit();
    } catch (error) {
      console.error("Error submitting medicine:", error);
    }
  };

  return (
    <div className="medicine-page">
      <h2 className="medicinepage-section-title">Quản lý danh mục thuốc</h2>

      <MedicineSearchBar search={searchTerm} setSearch={setSearchTerm} onAdd={handleAdd} />

      <MedicineTable
        medicines={medicines}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      <div className="d-flex justify-content-center py-4">
        <h5 className="text-muted">Tổng số thuốc: {totalMedicines}</h5>
      </div>

      <div className="d-flex justify-content-center py-4 align-items-center">
        <button
          className="btn btn-secondary me-2"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </button>

        {/* Chữ trang được căn giữa */}
        <span className="mx-3">{`Trang ${currentPage} / ${totalPages}`}</span>

        <button
          className="btn btn-secondary ms-2"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>

      {/* Modal */}
      <MedicineFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
        editMedicine={editMedicine}
        emptyMedicine={EMPTY_MEDICINE}
      />
    </div>
  );
};

export default MedicineManagement;