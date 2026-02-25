const paymentSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order",
        required: true
    },
    transactionId: String,
    method: {
        type: String,
        enum: ["COD", "UPI", "Card", "NetBanking"]
    },
    amount: Number,
    status: {
        type: String,
        enum: ["Pending", "Success", "Failed", "Refunded"],
        default: "Pending"
    },
    paidAt: Date
}, { timestamps: true });