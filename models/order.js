const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            inventory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PerfumeInventory",
                required: true
            },
            perfumeName: String,
            size: Number,
            quantity: Number,
            price: Number,
            subtotal: Number
        }
    ],
    totalAmount: Number,
    paymentMethod: {
        type: String,
        enum: ["COD", "RAZORPAY"]
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    orderStatus: {
        type: String,
        enum: ["Placed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Placed"
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    shippingAddress: {
        name: String,
        phone: String,
        address: String,
        city: String,
        pincode: String
    },
    orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
