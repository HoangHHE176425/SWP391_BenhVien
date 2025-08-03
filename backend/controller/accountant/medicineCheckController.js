const { MedicineCheck, MedicineCheckDetail } = require('../../models/ReceptionistMedicine');
const Medicine = require('../../models/Medicine');
const Employee = require('../../models/Employee');
const Counter = require('../../models/Counter');
const mongoose = require('mongoose');

// Lấy danh sách nhà cung cấp từ database
const getSuppliers = async (req, res) => {
    try {
        // Lấy danh sách nhà cung cấp từ bảng medicinechecks
        const suppliers = await MedicineCheck.distinct('nhaCungCap').then(suppliers => 
            suppliers.filter(supplier => supplier && supplier.trim() !== '')
        );

        // Nếu chưa có dữ liệu, trả về danh sách mặc định
        if (suppliers.length === 0) {
            const defaultSuppliers = [
                { id: '1', name: 'Công ty Dược phẩm ABC', address: '123 Đường ABC, Quận 1, TP.HCM', phone: '028-1234-5678' },
                { id: '2', name: 'Công ty Dược phẩm XYZ', address: '456 Đường XYZ, Quận 2, TP.HCM', phone: '028-2345-6789' },
                { id: '3', name: 'Công ty Dược phẩm DEF', address: '789 Đường DEF, Quận 3, TP.HCM', phone: '028-3456-7890' },
                { id: '4', name: 'Công ty Dược phẩm GHI', address: '321 Đường GHI, Quận 4, TP.HCM', phone: '028-4567-8901' },
                { id: '5', name: 'Công ty Dược phẩm JKL', address: '654 Đường JKL, Quận 5, TP.HCM', phone: '028-5678-9012' }
            ];
            return res.status(200).json({
                message: "OK",
                suppliers: defaultSuppliers
            });
        }

        // Format dữ liệu từ database
        const formattedSuppliers = suppliers.map((supplier, index) => ({
            id: String(index + 1),
            name: supplier,
            address: '',
            phone: ''
        }));

        res.status(200).json({
            message: "OK",
            suppliers: formattedSuppliers
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách phiếu kiểm thuốc
const getMedicineCheckList = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filter parameters
        const { trangThai, nhaCungCap, ngayKiemTu, ngayKiemDen, searchTerm, hanSuDung } = req.query;
        
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

        // Filter theo hạn sử dụng
        if (hanSuDung) {
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            
            // Lấy danh sách phiếu kiểm có thuốc theo điều kiện hạn sử dụng
            let detailQuery = {};
            switch (hanSuDung) {
                case 'expired':
                    detailQuery.hanDung = { $lt: today };
                    break;
                case 'warning':
                    detailQuery.hanDung = { 
                        $gte: today, 
                        $lte: thirtyDaysFromNow 
                    };
                    break;
                case 'good':
                    detailQuery.hanDung = { $gt: thirtyDaysFromNow };
                    break;
            }
            
            if (Object.keys(detailQuery).length > 0) {
                const detailsWithExpiration = await MedicineCheckDetail.find(detailQuery).distinct('phieuKiemId');
                query._id = { $in: detailsWithExpiration };
            }
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
        const decoded = req.user; // Lấy thông tin user từ middleware
        const { nhaCungCap, ghiChu } = req.body;

        if (!nhaCungCap) {
            return res.status(400).json({ message: "Nhà cung cấp là bắt buộc" });
        }

        // Tự động sinh mã phiếu kiểm và số hóa đơn - đồng bộ với dữ liệu hiện có
        let checkCounter = await Counter.findById('medicineCheck');
        let invoiceCounter = await Counter.findById('medicineInvoice');
        
        // Đồng bộ counter cho mã phiếu kiểm
        if (!checkCounter) {
            const maxCheck = await MedicineCheck.findOne().sort({ maPhieuKiem: -1 });
            let nextSeq = 1;
            
            if (maxCheck && maxCheck.maPhieuKiem) {
                const match = maxCheck.maPhieuKiem.match(/PKT_(\d+)/);
                if (match) {
                    nextSeq = parseInt(match[1]) + 1;
                }
            }
            
            checkCounter = await Counter.findByIdAndUpdate(
                { _id: 'medicineCheck' },
                { seq: nextSeq },
                { new: true, upsert: true }
            );
        }
        
        // Đồng bộ counter cho số hóa đơn
        if (!invoiceCounter) {
            const maxInvoice = await MedicineCheck.findOne().sort({ soHoaDon: -1 });
            let nextInvoiceSeq = 1;
            
            if (maxInvoice && maxInvoice.soHoaDon) {
                const match = maxInvoice.soHoaDon.match(/INV_(\d+)/);
                if (match) {
                    nextInvoiceSeq = parseInt(match[1]) + 1;
                }
            }
            
            invoiceCounter = await Counter.findByIdAndUpdate(
                { _id: 'medicineInvoice' },
                { seq: nextInvoiceSeq },
                { new: true, upsert: true }
            );
        }
        
        // Tăng counter và tạo mã
        checkCounter = await Counter.findByIdAndUpdate(
            { _id: 'medicineCheck' },
            { $inc: { seq: 1 } },
            { new: true }
        );
        
        invoiceCounter = await Counter.findByIdAndUpdate(
            { _id: 'medicineInvoice' },
            { $inc: { seq: 1 } },
            { new: true }
        );
        
        const maPhieuKiem = `PKT_${String(checkCounter.seq).padStart(6, '0')}`;
        const soHoaDon = `INV_${String(invoiceCounter.seq).padStart(6, '0')}`;

        const newCheck = new MedicineCheck({
            maPhieuKiem,
            soHoaDon,
            nguoiKiem: decoded.id,
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
        const decoded = req.user; // Lấy thông tin user từ middleware
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
        const decoded = req.user; // Lấy thông tin user từ middleware
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
        const decoded = req.user; // Lấy thông tin user từ middleware
        const { checkId } = req.params;
        const { ghiChu, fileDinhKem } = req.body || {};

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
        if (ghiChu !== undefined) {
            check.ghiChu = ghiChu;
        }
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

// Kiểm tra trạng thái thuốc trong kho
const checkMedicineInventoryStatus = async (req, res) => {
    try {
        const { checkId } = req.params;
        
        const check = await MedicineCheck.findById(checkId);
        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }
        
        // Lấy chi tiết thuốc từ phiếu kiểm
        const details = await MedicineCheckDetail.find({ phieuKiemId: checkId });
        
        // Kiểm tra từng thuốc có trong kho không
        const inventoryStatus = [];
        for (const detail of details) {
            const medicinesInInventory = await Medicine.find({ 
                name: detail.tenThuoc,
                isActive: true 
            }).sort({ createdAt: -1 });
            
            inventoryStatus.push({
                detail,
                medicinesInInventory,
                hasInInventory: medicinesInInventory.length > 0,
                totalInInventory: medicinesInInventory.length
            });
        }
        
        const totalInInventory = inventoryStatus.filter(item => item.hasInInventory).length;
        const totalDetails = details.length;
        const isFullyInInventory = totalInInventory === totalDetails;
        
        res.status(200).json({
            message: "OK",
            check,
            inventoryStatus,
            totalInInventory,
            totalDetails,
            isFullyInInventory
        });
    } catch (error) {
        console.error("Error checking medicine inventory status:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách thuốc đã được thêm vào kho từ phiếu kiểm
const getMedicinesFromCheck = async (req, res) => {
    try {
        const { checkId } = req.params;
        
        const check = await MedicineCheck.findById(checkId);
        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }
        
        // Lấy chi tiết thuốc từ phiếu kiểm
        const details = await MedicineCheckDetail.find({ phieuKiemId: checkId });
        
        // Tìm tất cả thuốc có tên trùng với các thuốc trong phiếu kiểm
        const medicineNames = details.map(detail => detail.tenThuoc);
        
        const medicines = await Medicine.find({ 
            name: { $in: medicineNames },
            isActive: true 
        }).sort({ createdAt: -1 });
        
        // Tạo mapping giữa thuốc trong kho và thuốc trong phiếu kiểm
        const medicineMapping = details.map(detail => {
            const matchingMedicines = medicines.filter(med => med.name === detail.tenThuoc);
            return {
                originalDetail: detail,
                medicinesInInventory: matchingMedicines
            };
        });
        
        res.status(200).json({
            message: "OK",
            check,
            medicines,
            medicineMapping,
            totalMedicines: medicines.length,
            totalDetails: details.length
        });
    } catch (error) {
        console.error("Error getting medicines from check:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy thống kê kiểm thuốc
const getMedicineCheckStats = async (req, res) => {
    try {

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

// Hàm thêm thuốc vào kho sau khi kiểm thuốc thành công
// Đã bỏ chức năng tự động thêm thuốc
// const addMedicinesToInventory = async (details, supplierName, addedBy) => {
//     // Hàm này đã được bỏ
// };

// Lấy danh sách thuốc đã kiểm thành công và còn hạn sử dụng
const getCheckedMedicinesForAdding = async (req, res) => {
    try {
        const { checkId } = req.params;
        
        const check = await MedicineCheck.findById(checkId);
        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy phiếu kiểm" });
        }
        
        // Lấy chi tiết thuốc từ phiếu kiểm
        const details = await MedicineCheckDetail.find({ phieuKiemId: checkId });
        
        // Lọc ra những thuốc đã kiểm thành công và còn hạn sử dụng
        const today = new Date();
        const validMedicines = details.filter(detail => {
            // Kiểm tra thuốc đã được kiểm thành công (số lượng thực tế > 0)
            const isValidQuantity = detail.soLuongThucTe > 0;
            
            // Kiểm tra còn hạn sử dụng
            const expirationDate = new Date(detail.hanDung);
            const isNotExpired = expirationDate > today;
            
            return isValidQuantity && isNotExpired;
        });
        
        // Tạo danh sách thuốc sẵn sàng thêm vào kho
        const medicinesToAdd = validMedicines.map((detail, index) => ({
            originalDetail: detail,
            medicineId: `MED${String(index + 1).padStart(3, '0')}`, // Tạo ID theo format MED001, MED002,...
            name: detail.tenThuoc,
            expirationDate: detail.hanDung,
            quantity: detail.soLuongThucTe,
            unitPrice: detail.giaNhap,
            // Các trường khác sẽ được người dùng nhập
            type: '',
            group: '',
            ingredient: '',
            indication: '',
            contraindication: '',
            dosage: '',
            sideEffects: '',
            storage: ''
        }));
        
        res.status(200).json({
            message: "OK",
            check,
            medicinesToAdd,
            totalValidMedicines: medicinesToAdd.length,
            totalCheckedMedicines: details.length
        });
    } catch (error) {
        console.error("Error getting checked medicines for adding:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Thêm thuốc vào kho sau khi kiểm thuốc thành công
const addMedicineToInventory = async (req, res) => {
    try {
        const decoded = req.user;
        const { 
            medicineId, 
            name, 
            type, 
            group, 
            ingredient, 
            indication, 
            contraindication, 
            dosage, 
            sideEffects, 
            precaution, 
            interaction, 
            note, 
            storage, 
            quantity, 
            unitPrice, 
            expirationDate,
            supplier 
        } = req.body;

        // Validate required fields
        if (!medicineId || !name || !type || !quantity || !unitPrice || !expirationDate) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }

        // Kiểm tra xem mã thuốc đã tồn tại chưa
        const existingMedicine = await Medicine.findOne({ medicineId });
        if (existingMedicine) {
            return res.status(400).json({ message: "Mã thuốc đã tồn tại trong hệ thống" });
        }

        // Kiểm tra xem tên thuốc đã tồn tại chưa
        const existingMedicineByName = await Medicine.findOne({ name });
        if (existingMedicineByName) {
            return res.status(400).json({ message: "Tên thuốc đã tồn tại trong hệ thống" });
        }

        // Tạo thuốc mới
        const newMedicine = new Medicine({
            medicineId,
            name,
            type,
            group: group || '',
            ingredient: ingredient || '',
            indication: indication || '',
            contraindication: contraindication || '',
            dosage: dosage || '',
            sideEffects: sideEffects || '',
            precaution: precaution || '',
            interaction: interaction || '',
            note: note || '',
            storage: storage || '',
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            expirationDate: new Date(expirationDate),
            supplier: supplier || null,
            isActive: true,
            createdBy: decoded.id
        });

        await newMedicine.save();

        res.status(201).json({
            message: "Thêm thuốc vào kho thành công",
            medicine: newMedicine
        });
    } catch (error) {
        console.error("Error adding medicine to inventory:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Thêm nhiều thuốc vào kho cùng lúc
const addMultipleMedicinesToInventory = async (req, res) => {
    try {
        const decoded = req.user;
        const { medicines } = req.body;

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ message: "Danh sách thuốc không hợp lệ" });
        }

        const results = [];
        const errors = [];

        for (const medicineData of medicines) {
            try {
                const { 
                    medicineId, 
                    name, 
                    type, 
                    group, 
                    ingredient, 
                    indication, 
                    contraindication, 
                    dosage, 
                    sideEffects, 
                    precaution, 
                    interaction, 
                    note, 
                    storage, 
                    quantity, 
                    unitPrice, 
                    expirationDate,
                    supplier 
                } = medicineData;

                // Validate required fields
                if (!medicineId || !name || !type || !quantity || !unitPrice || !expirationDate) {
                    errors.push({ medicineId, error: "Thiếu thông tin bắt buộc" });
                    continue;
                }

                // Kiểm tra xem mã thuốc đã tồn tại chưa
                const existingMedicine = await Medicine.findOne({ medicineId });
                if (existingMedicine) {
                    errors.push({ medicineId, error: "Mã thuốc đã tồn tại" });
                    continue;
                }

                // Kiểm tra xem tên thuốc đã tồn tại chưa
                const existingMedicineByName = await Medicine.findOne({ name });
                if (existingMedicineByName) {
                    errors.push({ medicineId, error: "Tên thuốc đã tồn tại" });
                    continue;
                }

                // Tạo thuốc mới
                const newMedicine = new Medicine({
                    medicineId,
                    name,
                    type,
                    group: group || '',
                    ingredient: ingredient || '',
                    indication: indication || '',
                    contraindication: contraindication || '',
                    dosage: dosage || '',
                    sideEffects: sideEffects || '',
                    precaution: precaution || '',
                    interaction: interaction || '',
                    note: note || '',
                    storage: storage || '',
                    quantity: parseInt(quantity),
                    unitPrice: parseFloat(unitPrice),
                    expirationDate: new Date(expirationDate),
                    supplier: supplier || null,
                    isActive: true,
                    createdBy: decoded.id
                });

                await newMedicine.save();
                results.push(newMedicine);

            } catch (error) {
                errors.push({ 
                    medicineId: medicineData.medicineId, 
                    error: error.message 
                });
            }
        }

        res.status(200).json({
            message: "Hoàn tất thêm thuốc",
            successCount: results.length,
            errorCount: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error("Error adding multiple medicines to inventory:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách hóa đơn theo nhà cung cấp
const getInvoicesBySupplier = async (req, res) => {
    try {
        const { supplierName } = req.query;
        
        if (!supplierName) {
            return res.status(400).json({ message: "Tên nhà cung cấp là bắt buộc" });
        }

        // Lấy danh sách hóa đơn từ phiếu kiểm thuốc theo nhà cung cấp
        const invoices = await MedicineCheck.find({ 
            nhaCungCap: { $regex: supplierName, $options: 'i' } 
        })
        .select('soHoaDon nhaCungCap ngayKiem')
        .sort({ ngayKiem: -1 })
        .limit(50);

        res.status(200).json({
            message: "OK",
            invoices
        });
    } catch (error) {
        console.error("Error fetching invoices by supplier:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách thuốc theo hóa đơn
const getMedicinesByInvoice = async (req, res) => {
    try {
        const { invoiceNumber } = req.query;
        
        if (!invoiceNumber) {
            return res.status(400).json({ message: "Số hóa đơn là bắt buộc" });
        }

        // Tìm phiếu kiểm theo số hóa đơn
        const check = await MedicineCheck.findOne({ 
            soHoaDon: { $regex: invoiceNumber, $options: 'i' } 
        });

        if (!check) {
            return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
        }

        // Lấy chi tiết thuốc từ phiếu kiểm
        const medicines = await MedicineCheckDetail.find({ 
            phieuKiemId: check._id 
        })
        .select('maThuoc tenThuoc soLo hanDung soLuongNhap donViTinh giaNhap')
        .sort({ createdAt: 1 });

        res.status(200).json({
            message: "OK",
            invoice: check,
            medicines
        });
    } catch (error) {
        console.error("Error fetching medicines by invoice:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy thông tin thuốc theo mã thuốc
const getMedicineByCode = async (req, res) => {
    try {
        const { medicineCode } = req.query;
        
        if (!medicineCode) {
            return res.status(400).json({ message: "Mã thuốc là bắt buộc" });
        }

        // Tìm thuốc trong kho theo mã thuốc
        const medicine = await Medicine.findOne({ 
            medicineId: { $regex: medicineCode, $options: 'i' },
            isActive: true
        });

        if (!medicine) {
            return res.status(404).json({ message: "Không tìm thấy thuốc" });
        }

        res.status(200).json({
            message: "OK",
            medicine
        });
    } catch (error) {
        console.error("Error fetching medicine by code:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách thuốc đã được kiểm và sẵn sàng thêm vào kho
const getAvailableCheckedMedicines = async (req, res) => {
    try {
        // Lấy tất cả phiếu kiểm đã kiểm
        const completedChecks = await MedicineCheck.find({ 
            trangThai: 'Đã kiểm' 
        }).sort({ ngayKiem: -1 });

        const availableMedicines = [];

        for (const check of completedChecks) {
            // Lấy chi tiết thuốc từ phiếu kiểm
            const details = await MedicineCheckDetail.find({ phieuKiemId: check._id });
            
            // Lọc ra những thuốc đã kiểm thành công và còn hạn sử dụng
            const today = new Date();
            const validMedicines = details.filter(detail => {
                // Kiểm tra thuốc đã được kiểm thành công (số lượng thực tế > 0)
                const isValidQuantity = detail.soLuongThucTe > 0;
                
                // Kiểm tra còn hạn sử dụng
                const expirationDate = new Date(detail.hanDung);
                const isNotExpired = expirationDate > today;
                
                return isValidQuantity && isNotExpired;
            });

            // Thêm tất cả thuốc đã kiểm thành công vào danh sách
            for (const detail of validMedicines) {
                // Kiểm tra xem thuốc đã có trong kho chưa
                const existingMedicine = await Medicine.findOne({ 
                    name: detail.tenThuoc,
                    isActive: true 
                });

                availableMedicines.push({
                    checkId: check._id,
                    checkInfo: {
                        maPhieuKiem: check.maPhieuKiem,
                        nhaCungCap: check.nhaCungCap,
                        soHoaDon: check.soHoaDon,
                        ngayKiem: check.ngayKiem,
                        nguoiKiem: check.nguoiKiem
                    },
                    medicineDetail: detail,
                    medicineId: `${check.maPhieuKiem}_${detail.maThuoc}`,
                    name: detail.tenThuoc,
                    expirationDate: detail.hanDung,
                    quantity: detail.soLuongThucTe,
                    unitPrice: detail.giaNhap,
                    soLo: detail.soLo,
                    donViTinh: detail.donViTinh,
                    ghiChu: detail.ghiChu,
                    // Các trường khác sẽ được người dùng nhập
                    type: '',
                    group: '',
                    ingredient: '',
                    indication: '',
                    contraindication: '',
                    dosage: '',
                    sideEffects: '',
                    precaution: '',
                    interaction: '',
                    note: '',
                    storage: '',
                    // Thông tin về trạng thái trong kho
                    alreadyInInventory: !!existingMedicine,
                    existingMedicineId: existingMedicine?._id
                });
            }
        }

        res.status(200).json({
            message: "OK",
            availableMedicines,
            totalAvailable: availableMedicines.length
        });
    } catch (error) {
        console.error("Error getting available checked medicines:", error);
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
    getMedicineCheckStats,
    getMedicinesFromCheck,
    checkMedicineInventoryStatus,
    getSuppliers,
    getCheckedMedicinesForAdding,
    addMedicineToInventory,
    addMultipleMedicinesToInventory,
    getInvoicesBySupplier,
    getMedicinesByInvoice,
    getMedicineByCode,
    getAvailableCheckedMedicines
}; 