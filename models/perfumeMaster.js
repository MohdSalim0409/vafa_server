const mongoose = require("mongoose");

const perfumeMasterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    brand: {
        type: String,
        required: true,
        index: true
    },

    category: {
        type: String,
        enum: ["Men", "Women", "Unisex"],
        required: true
    },

    concentration: {
        type: String,
        enum: ["EDT", "EDP", "Parfum", "Eau Fraiche", "Body Mist"],
        required: true
    },

    fragranceFamily: {
        type: String,
        enum: ["Floral", "Woody", "Fresh", "Oriental", "Citrus", "Fruity", "Aquatic", "Spicy"],
    },

    topNotes: [String],
    middleNotes: [String],
    baseNotes: [String],

    description: String,

    images: [
        {
            url: String,
            alt: String
        }
    ],

    status: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("PerfumeMaster", perfumeMasterSchema);