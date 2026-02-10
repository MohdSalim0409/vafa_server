const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({

    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    courierName: String,
    trackingNumber: String,

    status: {
        type: String,
        enum: ["Processing", "In Transit", "Out For Delivery", "Delivered"],
        default: "Processing"
    },

    shippedDate: Date,
    deliveredDate: Date

}, { timestamps: true });

module.exports = mongoose.model("Shipment", shipmentSchema);
