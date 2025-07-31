import React, { useEffect, useState } from "react";
import axiosInstance from "../../../axiosInstance";
import "../../assets/css/MedicineManagement.css";
import MedicineTable from "../../components/pharmacist/MedicineTable";
import MedicineSearchBar from "../../components/pharmacist/MedicineSearchBar";
import MedicineFormModal from "../../components/pharmacist/MedicineFormModal";

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
  const [totalPages, setTotalPages] = useState(0);
  const [medicinesPerPage] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await axios.get(`/api/receptionist/medicinesall?page=${currentPage}&limit=${medicinesPerPage}&searchTerm=${searchTerm}`);
        console.log("API Response:", res.data);
        if (Array.isArray(res.data.medicines)) {
          setMedicines(res.data.medicines);
          setTotalMedicines(res.data.totalMedicines);
          setTotalPages(res.data.totalPages);
        } else {
          setMedicines([]);
        }
      } catch (error) {
        setMedicines([]);
        console.error("Error fetching medicine details:", error);
      }
    };

    fetchMedicines();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    
  }, [filterMode]);

  useEffect(() => {
    const lowStockList = medicines.find(isLowStock);
    const isExpiringList = medicines.find(isExpiring);
    if (!lowStockList && !isExpiringList) return;
    alert("Đang có thuốc sắp hết hàng hoặc hết hạn!");
  }, []);

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

  const handleDisable = async (medicine) => {
    const reason = prompt("Nhập lý do ngừng kinh doanh:");
    if (!reason) return;

    try {
      await axios.put(`/api/staff/medicines/${medicine._id}/disable`, { reason });
      setMedicines(prevState => prevState.map(m => m._id === medicine._id ? { ...m, isActive: false, disableReason: reason } : m));
    } catch (error) {
      console.error("Error disabling medicine:", error);
    }
  };

  const handleSubmit = async (form) => {
    try {
      if (editMedicine) {
        await axios.put(`/api/receptionist/medicines/${editMedicine._id}`, form);
      } else {
        await axios.post(`/api/receptionist/medicines`, form);
      }
      setShowModal(false);
      // Sau khi submit, gọi lại fetch để cập nhật dữ liệu
      const fetchAfterSubmit = async () => {
        try {
          const res = await axios.get(`/api/receptionist/medicinesall?page=${currentPage}&limit=${medicinesPerPage}&searchTerm=${searchTerm}`);
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

  const applyFilter = (medicines) => {
    if (filterMode === "low-stock") {
      return medicines.filter(isLowStock);
    } else if (filterMode === "expiring") {
      return medicines.filter(isExpiring);
    }
    return medicines;
  };

  const isLowStock = (m) => {
    return m.quantity < 10 && m.isActive;
  }

  const isExpiring = (m) => {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);
    return new Date(m.expirationDate) <= in30Days && m.isActive;
  }

  const filteredMedicines = applyFilter(medicines);

  return (
    <div className="medicine-page">
      <h2 className="medicinepage-section-title">Quản lý danh mục thuốc</h2>

      <MedicineSearchBar search={searchTerm} setSearch={setSearchTerm} onAdd={handleAdd} />

      <div className="btn-group">
        <button className="btn btn-outline-primary" onClick={() => setFilterMode("all")}>Tất cả</button>
        <button className="btn btn-outline-warning" onClick={() => setFilterMode("low-stock")}>Sắp hết hàng</button>
        <button className="btn btn-outline-danger" onClick={() => setFilterMode("expiring")}>Sắp hết hạn</button>
      </div>

      <MedicineTable
        medicines={filteredMedicines}
        onEdit={handleEdit}
        onDisable={handleDisable}
      />

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
        <span className="mx-3">{`Trang ${currentPage} / ${totalPages}`}</span>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>

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
