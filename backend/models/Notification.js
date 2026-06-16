const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true }, 
    type: { type: String, default: "info" }, 
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", NotificationSchema);
