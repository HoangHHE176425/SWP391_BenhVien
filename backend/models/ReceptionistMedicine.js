const mongoose = require("mongoose");

// Schema cho phiếu kiểm thuốc
const medicineCheckSchema = new mongoose.Schema({
  maPhieuKiem: { 
    type: String, 
    required: true, 
    unique: true 
  }, // Mã phiếu kiểm (tự sinh)
  ngayKiem: { 
    type: Date, 
    required: true,
    default: Date.now 
  }, // Ngày kiểm thực tế
  nguoiKiem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true 
  }, // Tên người kiểm (kế toán)
  soHoaDon: { 
    type: String, 
    required: true 
  }, // Số hóa đơn từ nhà cung cấp
  nhaCungCap: { 
    type: String, 
    required: true 
  }, // Tên nhà cung cấp
  trangThai: { 
    type: String, 
    enum: ["Chưa kiểm", "Đã kiểm", "Có sai lệch"], 
    default: "Chưa kiểm" 
  }, // Trạng thái kiểm
  fileDinhKem: [{ 
    type: String 
  }], // Tài liệu đính kèm (biên bản, ảnh, hóa đơn)
  ghiChu: { 
    type: String 
  }, // Ghi chú tổng quát
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee" 
  }, // Người tạo phiếu
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee" 
  } // Người cập nhật cuối
}, { timestamps: true });

// Schema cho chi tiết thuốc kiểm
const medicineCheckDetailSchema = new mongoose.Schema({
  phieuKiemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "MedicineCheck", 
    required: true 
  }, // Reference đến phiếu kiểm
  maThuoc: { 
    type: String, 
    required: true 
  }, // Mã thuốc
  tenThuoc: { 
    type: String, 
    required: true 
  }, // Tên thuốc
  soLo: { 
    type: String, 
    required: true 
  }, // Số lô
  hanDung: { 
    type: Date, 
    required: true 
  }, // Hạn dùng
  soLuongNhap: { 
    type: Number, 
    required: true 
  }, // Số lượng trên phiếu nhập
  soLuongThucTe: { 
    type: Number, 
    required: true 
  }, // Số lượng thực kiểm
  donViTinh: { 
    type: String, 
    required: true 
  }, // Đơn vị tính
  giaNhap: { 
    type: Number, 
    required: true 
  }, // Giá nhập
  ghiChu: { 
    type: String 
  }, // Ghi chú nếu có sai lệch
  coSaiLech: { 
    type: Boolean, 
    default: false 
  }, // Có sai lệch hay không
  chenhLech: { 
    type: Number, 
    default: 0 
  } // Số lượng chênh lệch (thực tế - nhập)
}, { timestamps: true });

// Middleware để tự động sinh mã phiếu kiểm
medicineCheckSchema.pre('save', async function(next) {
  if (this.isNew && !this.maPhieuKiem) {
    try {
      const counter = await mongoose.model('Counter').findByIdAndUpdate(
        { _id: 'medicineCheck' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.maPhieuKiem = `PKT_${String(counter.seq).padStart(6, '0')}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Middleware để tính toán chênh lệch và cập nhật trạng thái
medicineCheckDetailSchema.pre('save', function(next) {
  if (this.soLuongThucTe !== undefined && this.soLuongNhap !== undefined) {
    this.chenhLech = this.soLuongThucTe - this.soLuongNhap;
    this.coSaiLech = this.chenhLech !== 0;
  }
  next();
});

// Static method để cập nhật trạng thái phiếu kiểm
medicineCheckSchema.methods.updateTrangThai = async function() {
  const details = await mongoose.model('MedicineCheckDetail').find({ phieuKiemId: this._id });
  const hasDiscrepancy = details.some(detail => detail.coSaiLech);
  
  if (details.length === 0) {
    this.trangThai = "Chưa kiểm";
  } else if (hasDiscrepancy) {
    this.trangThai = "Có sai lệch";
  } else {
    this.trangThai = "Đã kiểm";
  }
  
  return this.save();
};

// Index cho tìm kiếm hiệu quả
medicineCheckSchema.index({ maPhieuKiem: 1 });
medicineCheckSchema.index({ ngayKiem: -1 });
medicineCheckSchema.index({ trangThai: 1 });
medicineCheckSchema.index({ nhaCungCap: 1 });

medicineCheckDetailSchema.index({ phieuKiemId: 1 });
medicineCheckDetailSchema.index({ maThuoc: 1 });

// Export models
const MedicineCheck = mongoose.model("MedicineCheck", medicineCheckSchema);
const MedicineCheckDetail = mongoose.model("MedicineCheckDetail", medicineCheckDetailSchema);

module.exports = {
  MedicineCheck,
  MedicineCheckDetail
};
