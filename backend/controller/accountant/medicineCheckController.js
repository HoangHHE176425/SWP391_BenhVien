const { MedicineCheck, MedicineCheckDetail } = require('../../models/ReceptionistMedicine');
const Medicine = require('../../models/Medicine');
const Employee = require('../../models/Employee');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Lấy danh sách phiếu kiểm thuốc
const getMedicineCheckList = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filter parameters
        const { trangThai, nhaCungCap, ngayKiemTu, ngayKiemDen, searchTerm } = req.query;
        
        let query = {};
        
        if (trangThai) {
            query.trangThai = trangThai;
        }
        
        if (nhaCungCap) {
            query.nhaCungCap = { $regex: nhaCungCap, $options: 'i' };
        }
        
        if (ngayKiemTu && ngayKiemDen) {
            query.ngayKiem = {
                $gte: new Date(ngayKiemTu),
                $lte: new Date(ngayKiemDen)
            };
        }
        
        if (searchTerm) {
            query.$or = [
                { maPhieuKiem: { $regex: searchTerm, $options: 'i' } },
                { soHoaDon: { $regex: searchTerm, $options: 'i' } },
                { nhaCungCap: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const totalChecks = await MedicineCheck.countDocuments(query);
        const totalPages = Math.ceil(totalChecks / limit);

        const checks = await MedicineCheck.find(query)
            .populate('nguoiKiem', 'name')
            .populate('createdBy', 'name')
            .sort({ ngayKiem: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: "OK",
            checks,
            totalChecks,
            totalPages,
            currentPage: page,
            perPage: limit
        });
    } catch (error) {
        console.error("Error fetching medicine checks:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Tạo phiếu kiểm thuốc mới
const createMedicineCheck = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { soHoaDon, nhaCungCap, ghiChu } = req.body;

        if (!soHoaDon || !nhaCungCap) {
            return res.status(400).json({ message: "Số hóa đơn và nhà cung cấp là bắt buộc" });
        }

        // Kiểm tra xem đã có phiếu kiểm cho hóa đơn này chưa
        const existingCheck = await MedicineCheck.findOne({ soHoaDon });
        if (existingCheck) {
            return res.status(400).json({ message: "Đã tồn tại phiếu kiểm cho hóa đơn này" });
        }

        const newCheck = new MedicineCheck({
            nguoiKiem: decoded.id,
            soHoaDon,
            nhaCungCap,
            ghiChu,
            createdBy: decoded.id
        });

        await newCheck.save();

        res.status(201).json({
            message: "Tạo phiếu kiểm thành công",
            check: newCheck
        });
    } catch (error) {
        console.error("Error creating medicine check:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy chi tiết phiếu kiểm thuốc
const getMedicineCheckDetail = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const { checkId } = req.params;

        const check = await MedicineCheck.findById(checkId)
            .populate('nguoiKiem', 'name')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name');

        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }

        const details = await MedicineCheckDetail.find({ phieuKiemId: checkId })
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: "OK",
            check,
            details
        });
    } catch (error) {
        console.error("Error fetching medicine check detail:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Thêm chi tiết thuốc vào phiếu kiểm
const addMedicineCheckDetail = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { checkId } = req.params;
        const { maThuoc, tenThuoc, soLo, hanDung, soLuongNhap, soLuongThucTe, donViTinh, giaNhap, ghiChu } = req.body;

        // Validate required fields
        if (!maThuoc || !tenThuoc || !soLo || !hanDung || !soLuongNhap || !soLuongThucTe || !donViTinh || !giaNhap) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }

        // Kiểm tra phiếu kiểm có tồn tại không
        const check = await MedicineCheck.findById(checkId);
        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }

        // Kiểm tra xem thuốc đã được thêm vào phiếu này chưa
        const existingDetail = await MedicineCheckDetail.findOne({
            phieuKiemId: checkId,
            maThuoc: maThuoc
        });

        if (existingDetail) {
            return res.status(400).json({ message: "Thuốc này đã được thêm vào phiếu kiểm" });
        }

        const newDetail = new MedicineCheckDetail({
            phieuKiemId: checkId,
            maThuoc,
            tenThuoc,
            soLo,
            hanDung,
            soLuongNhap,
            soLuongThucTe,
            donViTinh,
            giaNhap,
            ghiChu
        });

        await newDetail.save();

        // Cập nhật trạng thái phiếu kiểm
        await check.updateTrangThai();

        res.status(201).json({
            message: "Thêm chi tiết thuốc thành công",
            detail: newDetail
        });
    } catch (error) {
        console.error("Error adding medicine check detail:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Cập nhật chi tiết thuốc kiểm
const updateMedicineCheckDetail = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { detailId } = req.params;
        const { soLuongThucTe, ghiChu } = req.body;

        if (soLuongThucTe === undefined || soLuongThucTe < 0) {
            return res.status(400).json({ message: "Số lượng thực tế không hợp lệ" });
        }

        const detail = await MedicineCheckDetail.findById(detailId);
        if (!detail) {
            return res.status(404).json({ message: "Không tìm thấy chi tiết thuốc" });
        }

        detail.soLuongThucTe = soLuongThucTe;
        if (ghiChu !== undefined) {
            detail.ghiChu = ghiChu;
        }

        await detail.save();

        // Cập nhật trạng thái phiếu kiểm
        const check = await MedicineCheck.findById(detail.phieuKiemId);
        if (check) {
            check.updatedBy = decoded.id;
            await check.updateTrangThai();
        }

        res.status(200).json({
            message: "Cập nhật thành công",
            detail
        });
    } catch (error) {
        console.error("Error updating medicine check detail:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Xác nhận hoàn tất kiểm thuốc
const completeMedicineCheck = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { checkId } = req.params;
        const { ghiChu, fileDinhKem } = req.body;

        const check = await MedicineCheck.findById(checkId);
        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }

        // Kiểm tra xem đã có chi tiết thuốc nào chưa
        const details = await MedicineCheckDetail.find({ phieuKiemId: checkId });
        if (details.length === 0) {
            return res.status(400).json({ message: "Chưa có chi tiết thuốc nào trong phiếu kiểm" });
        }

        // Cập nhật thông tin phiếu kiểm
        check.ghiChu = ghiChu || check.ghiChu;
        if (fileDinhKem && Array.isArray(fileDinhKem)) {
            check.fileDinhKem = fileDinhKem;
        }
        check.updatedBy = decoded.id;

        // Cập nhật trạng thái cuối cùng
        await check.updateTrangThai();

        // Kiểm tra có sai lệch không để gửi thông báo
        const hasDiscrepancy = details.some(detail => detail.coSaiLech);
        
        res.status(200).json({
            message: "Hoàn tất kiểm thuốc thành công",
            check,
            hasDiscrepancy,
            totalItems: details.length,
            discrepancyItems: details.filter(d => d.coSaiLech).length
        });
    } catch (error) {
        console.error("Error completing medicine check:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Xóa chi tiết thuốc khỏi phiếu kiểm
const deleteMedicineCheckDetail = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);
        const { detailId } = req.params;

        const detail = await MedicineCheckDetail.findById(detailId);
        if (!detail) {
            return res.status(404).json({ message: "Không tìm thấy chi tiết thuốc" });
        }

        await MedicineCheckDetail.findByIdAndDelete(detailId);

        // Cập nhật trạng thái phiếu kiểm
        const check = await MedicineCheck.findById(detail.phieuKiemId);
        if (check) {
            await check.updateTrangThai();
        }

        res.status(200).json({
            message: "Xóa chi tiết thuốc thành công"
        });
    } catch (error) {
        console.error("Error deleting medicine check detail:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy thống kê kiểm thuốc
const getMedicineCheckStats = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token" });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const { ngayKiemTu, ngayKiemDen } = req.query;
        
        let dateFilter = {};
        if (ngayKiemTu && ngayKiemDen) {
            dateFilter.ngayKiem = {
                $gte: new Date(ngayKiemTu),
                $lte: new Date(ngayKiemDen)
            };
        }

        // Thống kê theo trạng thái
        const statusStats = await MedicineCheck.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$trangThai",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Thống kê tổng quan
        const totalChecks = await MedicineCheck.countDocuments(dateFilter);
        const totalDetails = await MedicineCheckDetail.aggregate([
            {
                $lookup: {
                    from: "medicinechecks",
                    localField: "phieuKiemId",
                    foreignField: "_id",
                    as: "check"
                }
            },
            { $unwind: "$check" },
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalDiscrepancy: { $sum: { $cond: ["$coSaiLech", 1, 0] } },
                    totalValue: { $sum: { $multiply: ["$soLuongThucTe", "$giaNhap"] } }
                }
            }
        ]);

        res.status(200).json({
            message: "OK",
            stats: {
                statusStats,
                totalChecks,
                totalDetails: totalDetails[0] || { totalItems: 0, totalDiscrepancy: 0, totalValue: 0 }
            }
        });
    } catch (error) {
        console.error("Error getting medicine check stats:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    getMedicineCheckList,
    createMedicineCheck,
    getMedicineCheckDetail,
    addMedicineCheckDetail,
    updateMedicineCheckDetail,
    completeMedicineCheck,
    deleteMedicineCheckDetail,
    getMedicineCheckStats
}; 