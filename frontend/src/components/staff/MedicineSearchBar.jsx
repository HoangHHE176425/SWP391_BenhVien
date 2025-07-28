import React from "react";

const MedicineSearchBar = ({ search, setSearch, onAdd }) => {
  return (
    <div className="medicine-toolbar">
      <input
        type="text"
        placeholder="Tìm kiếm theo tên thuốc"
        value={search ?? ""}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button className="medicine-add-btn" onClick={onAdd}>+ Thêm thuốc</button>
    </div>
  );
};

export default MedicineSearchBar;
