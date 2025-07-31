import React from "react";
import { FaPen, FaTrashAlt } from "react-icons/fa";


const MedicineTable = ({ medicines, onEdit, onDisable }) => (
  <table className="medicine-table">
    <thead>
      <tr>
        <th>Tên thuốc</th>
        <th>Loại</th>
        <th>Hoạt chất</th>
        <th>Nhóm</th>
        <th>Giá</th>
        <th>Số lượng</th>
        <th>Hạn dùng</th>
        <th>Người thêm</th>
        <th>Hành động</th>
      </tr>
    </thead>
    <tbody>
      {medicines.map((med) => (
        <tr key={med._id} className={med.isActive ? "" : "table-secondary"}>
          <td>{med.name}</td>
          <td>{med.type}</td>
          <td>{med.ingredient}</td>
          <td>{med.group}</td>
          <td>{med.unitPrice?.toLocaleString()}</td>
          <td>{med.quantity}</td>
          <td>
            {med.expirationDate ? new Date(med.expirationDate).toLocaleDateString("vi-VN") : ""}
          </td>
          <td>{med.supplier?.email}</td>
          <td className="medicine-actions">
            <FaPen className="btn-edit" onClick={() => onEdit(med)} />
            <button
              className="btn btn-warning"
              onClick={() => onDisable(med)}
              disabled={!med.isActive}
            >
              Disable
            </button>
          </td>
        </tr>
      ))}
      {!medicines.length && (
        <tr>
          <td colSpan={9} className="text-center text-muted py-3">
            Không có thuốc nào
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default MedicineTable;
