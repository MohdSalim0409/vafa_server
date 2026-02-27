const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    transactionId: String,
    method: {
        type: String,
        enum: ["COD", "RAZORPAY", "UPI", "Card", "NetBanking"]
    },
    amount: Number,
    status: {
        type: String,
        enum: ["Pending", "Success", "Failed", "Refunded"],
        default: "Pending"
    },
    paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
