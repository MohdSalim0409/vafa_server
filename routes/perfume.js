// routes/perfume.js
const express = require("express");
const router = express.Router();
const PerfumeInventory = require("../models/PerfumeInventory");

router.get("/", async (req, res) => {
    try {
        // .populate('perfume') fetches the linked PerfumeMaster document
        const stock = await PerfumeInventory.find().populate("perfume");
        res.json(stock);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;