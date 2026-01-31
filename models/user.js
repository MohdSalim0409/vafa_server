
const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        city: {
            type: String,
        },

        state: {
            type: String,
        },

        pincode: {
            type: String,
        },

    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User
