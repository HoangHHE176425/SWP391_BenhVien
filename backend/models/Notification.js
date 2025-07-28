const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  isUrgent: { type: Boolean, default: false },
  receiver: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null = all users
  createdAt: { type: Date, default: Date.now },
  isReadBy: [{ type: Schema.Types.ObjectId, ref: "User" }] // list of users who already read this
});

module.exports = mongoose.model("Notification", NotificationSchema);
