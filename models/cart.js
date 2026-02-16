const mongoose = require("mongoose");


const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
        {
            inventory: { type: mongoose.Schema.Types.ObjectId, ref: "PerfumeInventory" },

            perfumeName: String,
            brand: String,
            image: String,
            size: Number,

            quantity: { type: Number, default: 1 },

            priceAtTime: Number,
            sku: String
        }
    ],

    totalAmount: { type: Number, default: 0 }

}, { timestamps: true });
module.exports = mongoose.model("Cart", cartSchema);
