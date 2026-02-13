const express = require("express");
const router = express.Router();
const PerfumeMaster = require("../models/perfumeMaster");
const multer = require("multer");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch perfumes for perfume directory

router.get("/fetchPerfumes", async (req, res) => {

    try {
        const perfumes = await PerfumeMaster.find({ status: true });
        res.json(perfumes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Create perfumes for perfume directory

router.post("/createPerfume", upload.single("images"), async (req, res) => {
    try {
        const body = req.body;

        const perfume = await PerfumeMaster.create({
            ...body,
            images: req.file ? req.file.filename : null
        });

        res.json(perfume);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------


// Update perfumes for perfume directory

router.put("/updatePerfume/:id", upload.single("images"), async (req, res) => {
    try {
        const updateData = {
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            concentration: req.body.concentration,
            fragranceFamily: req.body.fragranceFamily,
            description: req.body.description,
            status: req.body.status === "true"
        };

        // Convert notes to array
        if (req.body.topNotes)
            updateData.topNotes = req.body.topNotes.split(",");
        if (req.body.middleNotes)
            updateData.middleNotes = req.body.middleNotes.split(",");
        if (req.body.baseNotes)
            updateData.baseNotes = req.body.baseNotes.split(",");

        // If new image uploaded
        if (req.file) {
            updateData.images = req.file.filename;
        }

        const perfume = await PerfumeMaster.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(perfume);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
});


// ---------------------------------------------------------------------------------------------------------------------------------------

// Delete perfumes for perfume directory

router.delete("/deletePerfume/:id", async (req, res) => {

    try {

        const perfume = await PerfumeMaster.findByIdAndDelete(req.params.id);
        if (!perfume) { return res.status(404).json({ message: "Perfume not found" }) }
        res.json({ message: "Perfume deleted successfully" });
    } catch (error) {
        console.error("Error deleting perfume:", error);
        res.status(500).json({ message: error.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;
