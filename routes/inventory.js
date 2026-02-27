const express = require("express");
const router = express.Router();
const inventoryController = require("../controller/inventoryController");

// ---------------------------------------------------------------------------------------------------------------------------------------

router.get("/", inventoryController.getAllInventory);
router.get("/:id", inventoryController.getInventoryById);
router.post("/", inventoryController.createInventory);
router.put("/:id", inventoryController.updateInventory);
router.delete("/:id", inventoryController.deleteInventory);
router.patch("/:id/stock", inventoryController.updateStock);

// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;