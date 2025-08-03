const express = require('express');
const router = express.Router();
const medicineCheckController = require('../../controller/accountant/medicineCheckController');
const verifyToken = require('../../middleware/verifyToken');

// Middleware xác thực cho tất cả routes
router.use(verifyToken);

// Lấy danh sách phiếu kiểm thuốc
router.get('/checks', medicineCheckController.getMedicineCheckList);

// Tạo phiếu kiểm thuốc mới
router.post('/checks', medicineCheckController.createMedicineCheck);

// Lấy chi tiết phiếu kiểm thuốc
router.get('/checks/:checkId', medicineCheckController.getMedicineCheckDetail);

// Thêm chi tiết thuốc vào phiếu kiểm
router.post('/checks/:checkId/details', medicineCheckController.addMedicineCheckDetail);

// Cập nhật chi tiết thuốc kiểm
router.put('/checks/details/:detailId', medicineCheckController.updateMedicineCheckDetail);

// Xác nhận hoàn tất kiểm thuốc
router.put('/checks/:checkId/complete', medicineCheckController.completeMedicineCheck);

// Lấy danh sách thuốc đã được thêm vào kho từ phiếu kiểm
router.get('/checks/:checkId/medicines', medicineCheckController.getMedicinesFromCheck);

// Kiểm tra trạng thái thuốc trong kho
router.get('/checks/:checkId/inventory-status', medicineCheckController.checkMedicineInventoryStatus);

// Xóa chi tiết thuốc khỏi phiếu kiểm
router.delete('/checks/details/:detailId', medicineCheckController.deleteMedicineCheckDetail);

// Lấy thống kê kiểm thuốc
router.get('/checks/stats/overview', medicineCheckController.getMedicineCheckStats);

// Lấy danh sách nhà cung cấp
router.get('/suppliers', medicineCheckController.getSuppliers);

// Lấy danh sách thuốc đã kiểm thành công và còn hạn sử dụng để thêm vào kho
router.get('/checks/:checkId/medicines-for-adding', medicineCheckController.getCheckedMedicinesForAdding);

// Thêm một thuốc vào kho
router.post('/medicines', medicineCheckController.addMedicineToInventory);

// Thêm nhiều thuốc vào kho cùng lúc
router.post('/medicines/bulk', medicineCheckController.addMultipleMedicinesToInventory);

// Lấy danh sách hóa đơn theo nhà cung cấp
router.get('/suppliers/invoices', medicineCheckController.getInvoicesBySupplier);

// Lấy danh sách thuốc theo hóa đơn
router.get('/invoices/medicines', medicineCheckController.getMedicinesByInvoice);

// Lấy thông tin thuốc theo mã thuốc
router.get('/medicines/code', medicineCheckController.getMedicineByCode);

// Lấy danh sách thuốc đã được kiểm và sẵn sàng thêm vào kho
router.get('/medicines/available', medicineCheckController.getAvailableCheckedMedicines);

module.exports = router; 