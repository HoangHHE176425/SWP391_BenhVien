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

// Xóa chi tiết thuốc khỏi phiếu kiểm
router.delete('/checks/details/:detailId', medicineCheckController.deleteMedicineCheckDetail);

// Lấy thống kê kiểm thuốc
router.get('/checks/stats/overview', medicineCheckController.getMedicineCheckStats);

module.exports = router; 