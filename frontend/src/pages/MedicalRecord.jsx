import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";

const MedicalRecord = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchRecords = async () => {
            const token= localStorage.getItem("token");

      try {
        const res = await fetch("http://localhost:9999/api/user/profile/my-records", {
            method:"GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi khi tải hồ sơ");
        setRecords(data);
      } catch (error) {
        console.error("Lỗi fetch:", error.message);
      }
    };

    if (user) fetchRecords();
  }, [user]);

  const filteredRecords = records
    .filter((record) => {
      const nameMatch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
      const genderMatch = genderFilter === "all" ? true : record.gender === genderFilter;
      return nameMatch && genderMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Hồ sơ bệnh án của bạn</h2>

      {/* BỘ LỌC */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <select
            className="form-select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">Tất cả giới tính</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </select>
        </div>
        <div className="col-md-5 mb-2 text-end">
          <button className="btn btn-outline-primary" onClick={toggleSortOrder}>
            Sắp xếp theo ngày tạo {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Họ tên</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Chẩn đoán</th>
              <th>Ghi chú</th>
              <th>Vấn đề</th>
              <th>Bác sĩ</th>
              <th>Thuốc</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id}>
                <td>{record.name}</td>
                <td>{new Date(record.dateOfBirth).toLocaleDateString()}</td>
                <td>{record.gender}</td>
                <td>{record.diagnose || "-"}</td>
                <td>{record.note || "-"}</td>
                <td>{record.issues || "-"}</td>
                <td>{record.doctorId?.name || "Không rõ"}</td>
                <td>{record.medicine?.name || "Không rõ"}</td>
                <td>{new Date(record.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center text-muted">
                  Không có hồ sơ nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalRecord;
