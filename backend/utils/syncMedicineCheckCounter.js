const mongoose = require('mongoose');
const { MedicineCheck } = require('../models/ReceptionistMedicine');
const Counter = require('../models/Counter');
const db = require('../config/db');

// Script để đồng bộ Counter với dữ liệu MedicineCheck hiện có
const syncMedicineCheckCounter = async () => {
    try {
        console.log('Bắt đầu đồng bộ Counter cho MedicineCheck...');
        
        // Kết nối database
        await db();
        
        // Tìm mã phiếu kiểm lớn nhất hiện có
        const maxCheck = await MedicineCheck.findOne().sort({ maPhieuKiem: -1 });
        
        if (maxCheck && maxCheck.maPhieuKiem) {
            // Trích xuất số từ mã phiếu kiểm hiện có (PKT_000001 -> 1)
            const match = maxCheck.maPhieuKiem.match(/PKT_(\d+)/);
            if (match) {
                const currentMaxSeq = parseInt(match[1]);
                const nextSeq = currentMaxSeq + 1;
                
                // Cập nhật hoặc tạo counter mới
                await Counter.findByIdAndUpdate(
                    { _id: 'medicineCheck' },
                    { seq: currentMaxSeq },
                    { new: true, upsert: true }
                );
                
                console.log(`Đã đồng bộ Counter: ${currentMaxSeq}`);
                console.log(`Mã phiếu kiểm tiếp theo sẽ là: PKT_${String(nextSeq).padStart(6, '0')}`);
            }
        } else {
            // Không có dữ liệu, tạo counter với seq = 0
            await Counter.findByIdAndUpdate(
                { _id: 'medicineCheck' },
                { seq: 0 },
                { new: true, upsert: true }
            );
            console.log('Không có dữ liệu MedicineCheck, đã tạo Counter với seq = 0');
        }
        
        console.log('Đồng bộ Counter thành công!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi đồng bộ Counter:', error);
        process.exit(1);
    }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    syncMedicineCheckCounter();
}

module.exports = syncMedicineCheckCounter; 