const mongoose = require("mongoose");

const perfumeInventorySchema = new mongoose.Schema({

    perfume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PerfumeMaster",
        required: true,
        index: true
    },

    size: {
        type: Number,
        enum: [10, 20, 30, 50, 75, 100, 125, 150, 200],
        required: true
    },

    sku: {
        type: String,
        required: true,
        unique: true
    },

    batchNumber: {
        type: String,
        required: true
    },

    costPrice: {
        type: Number,
        required: true
    },

    sellingPrice: {
        type: Number,
        required: true
    },

    discountPercent: {
        type: Number,
        default: 0
    },

    quantity: {
        type: Number,
        default: 0
    },

    reorderLevel: {
        type: Number,
        default: 5
    },

    manufactureDate: Date,
    expiryDate: Date,

    warehouseLocation: {
        type: String,
        default: "Main Store"
    },

    status: {
        type: String,
        enum: ["In Stock", "Low Stock", "Out Of Stock"],
        default: "In Stock"
    }

}, { timestamps: true });

module.exports = mongoose.model("PerfumeInventory", perfumeInventorySchema);