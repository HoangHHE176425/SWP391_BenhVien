import React, { useEffect, useState } from "react";
import axiosInstance from "../../../axiosInstance";
import "../../assets/css/MedicineManagement.css";
import MedicineTable from "../../components/pharmacist/MedicineTable";
import MedicineSearchBar from "../../components/pharmacist/MedicineSearchBar";
import MedicineFormModal from "../../components/pharmacist/MedicineFormModal";
import PharmacyTransactionModal from "../../components/pharmacist/PharmacyTransactionModal";

const EMPTY_MEDICINE = {
    medicineId: "",
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
    const [patients, setPatients] = useState([]);
    const [totalMedicines, setTotalMedicines] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [medicinesPerPage] = useState(8);
    const [showModal, setShowModal] = useState(false);
    const [editMedicine, setEditMedicine] = useState(null);
    const [filterMode, setFilterMode] = useState("all");
    const [error, setError] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const res = await axios.get(`/api/pharmacist/medicinesall`, {
                    params: {
                        page: currentPage,
                        limit: medicinesPerPage,
                        searchTerm,
                        filterMode,
                    },
                });
                console.log("API Response:", res.data);
                if (Array.isArray(res.data.medicines)) {
                    setMedicines(res.data.medicines);
                    setTotalMedicines(res.data.totalMedicines || 0);
                    setTotalPages(res.data.totalPages || 0);
                } else {
                    console.warn("Medicines is not an array:", res.data.medicines);
                    setMedicines([]);
                    setTotalMedicines(0);
                    setTotalPages(0);
                }
                setError(null);
            } catch (error) {
                console.error("Error fetching medicine details:", error);
                setMedicines([]);
                setTotalMedicines(0);
                setTotalPages(0);
                setError("Không thể tải danh sách thuốc. Vui lòng thử lại sau.");
            }
        };

        const fetchPatients = async () => {
            try {
                const res = await axios.get(`/api/pharmacist/patients`);
                if (res.data && Array.isArray(res.data.patients)) {
                    setPatients(res.data.patients);
                } else {
                    setPatients([]);
                }
            } catch (error) {
                console.error("Error fetching patients:", error);
                setPatients([]);
            }
        };

        fetchMedicines();
        fetchPatients();
    }, [currentPage, searchTerm, filterMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMode]);

    useEffect(() => {
        const checkAlerts = async () => {
            try {
                const res = await axios.get(`/api/pharmacist/medicinesall`, {
                    params: { page: 1, limit: 1, filterMode: "low-stock" },
                });
                const hasLowStock = res.data.totalMedicines > 0;

                const resExpiring = await axios.get(`/api/pharmacist/medicinesall`, {
                    params: { page: 1, limit: 1, filterMode: "expiring" },
                });
                const hasExpiring = resExpiring.data.totalMedicines > 0;

                if (hasLowStock || hasExpiring) {
                    alert("Đang có thuốc sắp hết hàng hoặc hết hạn!");
                }
            } catch (error) {
                console.error("Error checking alerts:", error);
            }
        };
        checkAlerts();
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
            await axios.put(`/api/pharmacist/medicines/${medicine._id}/disable`, { reason });
            setMedicines((prevState) =>
                prevState.map((m) =>
                    m._id === medicine._id ? { ...m, isActive: false, disableReason: reason } : m
                )
            );
            alert('Biên bản kiểm kê đã được cập nhật cho thuốc này.');
        } catch (error) {
            console.error("Error disabling medicine:", error);
            setError("Không thể vô hiệu hóa thuốc. Vui lòng thử lại.");
        }
    };

    const handleSubmit = async (form) => {
        try {
            if (editMedicine) {
                await axios.put(`/api/pharmacist/medicines/${editMedicine._id}`, form);
            } else {
                await axios.post(`/api/pharmacist/medicines`, form);
            }
            setShowModal(false);
            const fetchAfterSubmit = async () => {
                try {
                    const res = await axios.get(`/api/pharmacist/medicinesall`, {
                        params: {
                            page: currentPage,
                            limit: medicinesPerPage,
                            searchTerm,
                            filterMode,
                        },
                    });
                    console.log("API Response after submit:", res.data);
                    if (Array.isArray(res.data.medicines)) {
                        setMedicines(res.data.medicines);
                        setTotalMedicines(res.data.totalMedicines || 0);
                        setTotalPages(res.data.totalPages || 0);
                    } else {
                        setMedicines([]);
                        setTotalMedicines(0);
                        setTotalPages(0);
                    }
                } catch (error) {
                    console.error("Error fetching after submit:", error);
                    setError("Không thể tải danh sách thuốc. Vui lòng thử lại sau.");
                }
            };
            fetchAfterSubmit();
        } catch (error) {
            console.error("Error submitting medicine:", error);
            setError("Không thể lưu thuốc. Vui lòng thử lại.");
        }
    };

    const handleTransactionSubmit = async (transactionData) => {
        try {
            const response = await axios.post(`/api/pharmacist/transactions`, transactionData);
            console.log("Transaction Response:", response.data);
            const res = await axios.get(`/api/pharmacist/medicinesall`, {
                params: { page: currentPage, limit: medicinesPerPage, searchTerm, filterMode },
            });
            if (Array.isArray(res.data.medicines)) {
                setMedicines(res.data.medicines);
                setTotalMedicines(res.data.totalMedicines || 0);
                setTotalPages(res.data.totalPages || 0);
            }
            alert("Giao dịch hoàn tất!");
        } catch (error) {
            console.error("Error processing transaction:", error);
            throw error;
        }
    };

    return (
        <div className="medicine-page">
            <h2 className="medicinepage-section-title">Quản lý danh mục thuốc</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <MedicineSearchBar search={searchTerm} setSearch={setSearchTerm} onAdd={handleAdd} />

            <div className="btn-group">
                <button
                    className={`btn btn-outline-primary ${filterMode === "all" ? "active" : ""}`}
                    onClick={() => setFilterMode("all")}
                >
                    Tất cả
                </button>
                <button
                    className={`btn btn-outline-warning ${filterMode === "low-stock" ? "active" : ""}`}
                    onClick={() => setFilterMode("low-stock")}
                >
                    Sắp hết hàng
                </button>
                <button
                    className={`btn btn-outline-danger ${filterMode === "expiring" ? "active" : ""}`}
                    onClick={() => setFilterMode("expiring")}
                >
                    Sắp hết hạn
                </button>
                <button className="btn btn-outline-success" onClick={() => setShowTransactionModal(true)}>
                    Tạo giao dịch
                </button>
            </div>

            <MedicineTable medicines={medicines} onEdit={handleEdit} onDisable={handleDisable} />

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

            <PharmacyTransactionModal
                show={showTransactionModal}
                onHide={() => setShowTransactionModal(false)}
                medicines={medicines}
                patients={patients}
                onSubmit={handleTransactionSubmit}
            />
        </div>
    );
};

export default MedicineManagement;