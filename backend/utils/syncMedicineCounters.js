const mongoose = require('mongoose');
const { MedicineCheck } = require('../models/ReceptionistMedicine');
const Counter = require('../models/Counter');
const db = require('../config/db');

// Script để đồng bộ Counter cho MedicineCheck và số hóa đơn
const syncMedicineCounters = async () => {
    try {
        console.log('Bắt đầu đồng bộ Counter cho MedicineCheck...');
        
        // Kết nối database
        await db();
        
        // Đồng bộ counter cho mã phiếu kiểm
        const maxCheck = await MedicineCheck.findOne().sort({ maPhieuKiem: -1 });
        if (maxCheck && maxCheck.maPhieuKiem) {
            const match = maxCheck.maPhieuKiem.match(/PKT_(\d+)/);
            if (match) {
                const currentMaxSeq = parseInt(match[1]);
                const nextSeq = currentMaxSeq + 1;
                
                await Counter.findByIdAndUpdate(
                    { _id: 'medicineCheck' },
                    { seq: currentMaxSeq },
                    { new: true, upsert: true }
                );
                
                console.log(`Đã đồng bộ Counter mã phiếu kiểm: ${currentMaxSeq}`);
                console.log(`Mã phiếu kiểm tiếp theo sẽ là: PKT_${String(nextSeq).padStart(6, '0')}`);
            }
        } else {
            await Counter.findByIdAndUpdate(
                { _id: 'medicineCheck' },
                { seq: 0 },
                { new: true, upsert: true }
            );
            console.log('Không có dữ liệu mã phiếu kiểm, đã tạo Counter với seq = 0');
        }
        
        // Đồng bộ counter cho số hóa đơn
        const maxInvoice = await MedicineCheck.findOne().sort({ soHoaDon: -1 });
        if (maxInvoice && maxInvoice.soHoaDon) {
            const match = maxInvoice.soHoaDon.match(/INV_(\d+)/);
            if (match) {
                const currentMaxInvoiceSeq = parseInt(match[1]);
                const nextInvoiceSeq = currentMaxInvoiceSeq + 1;
                
                await Counter.findByIdAndUpdate(
                    { _id: 'medicineInvoice' },
                    { seq: currentMaxInvoiceSeq },
                    { new: true, upsert: true }
                );
                
                console.log(`Đã đồng bộ Counter số hóa đơn: ${currentMaxInvoiceSeq}`);
                console.log(`Số hóa đơn tiếp theo sẽ là: INV_${String(nextInvoiceSeq).padStart(6, '0')}`);
            } else {
                // Nếu số hóa đơn hiện tại không theo format INV_xxx, bắt đầu từ 1
                await Counter.findByIdAndUpdate(
                    { _id: 'medicineInvoice' },
                    { seq: 0 },
                    { new: true, upsert: true }
                );
                console.log('Số hóa đơn hiện tại không theo format INV_xxx, đã tạo Counter với seq = 0');
                console.log('Số hóa đơn tiếp theo sẽ là: INV_000001');
            }
        } else {
            await Counter.findByIdAndUpdate(
                { _id: 'medicineInvoice' },
                { seq: 0 },
                { new: true, upsert: true }
            );
            console.log('Không có dữ liệu số hóa đơn, đã tạo Counter với seq = 0');
            console.log('Số hóa đơn tiếp theo sẽ là: INV_000001');
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
    syncMedicineCounters();
}

module.exports = syncMedicineCounters; 