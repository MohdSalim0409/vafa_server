const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },\
    reason: String,
    status: {
        type: String,
        enum: ["Requested", "Approved", "Rejected", "Refunded"],
        default: "Requested"
    },
    refundAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);
