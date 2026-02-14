const express = require("express");
const router = express.Router();
const PerfumeInventory = require("../models/PerfumeInventory");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch perfumes list to show in store front page

router.get("/", async (req, res) => {

    try {
        const stock = await PerfumeInventory.find().populate("perfume");
        res.json(stock);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;