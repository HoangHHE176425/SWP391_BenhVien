const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      enum: ["Thông Báo Nghỉ Lễ", "Khuyến Mãi", "Sự Kiện", "Cập Nhật Dịch Vụ", "Khác"],
      required: true,
    },
    author_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    
    thumbnail: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    validUntil: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const News = mongoose.model("News", newsSchema);
module.exports = News;