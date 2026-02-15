const express = require("express");
const router = express.Router();
const PerfumeInventory = require("../models/perfumeInventory");
const PerfumeMaster = require("../models/perfumeMaster");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch perfumes list to show in store front page

router.get("/", async (req, res) => {
    try {
        const data = await PerfumeInventory.aggregate([
            {
                $lookup: {
                    from: "perfumemasters",
                    localField: "perfume",
                    foreignField: "_id",
                    as: "perfume"
                }
            },
            { $unwind: "$perfume" },

            {
                $group: {
                    _id: "$perfume._id",
                    perfume: { $first: "$perfume" },
                    variants: {
                        $push: {
                            inventoryId: "$_id",
                            size: "$size",
                            price: "$sellingPrice",
                            quantity: "$quantity",
                            status: "$status"
                        }
                    }
                }
            }
        ]);

        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
});


// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;