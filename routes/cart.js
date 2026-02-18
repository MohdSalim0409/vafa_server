const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const PerfumeInventory = require("../models/perfumeInventory");
const User = require("../models/user");


// Add to cart
router.post("/add", async (req, res) => {
    console.log("Add to cart request:", req.body);
    try {
        const { userId, inventoryId, quantity } = req.body;

        const person = await User.findOne({ phone: userId });
        const inventory = await PerfumeInventory.findById(inventoryId).populate("perfume");

        if (!inventory) return res.status(404).json({ message: "Item not found" });

        let cart = await Cart.findOne({ user: person._id });

        if (!cart) {
            cart = new Cart({ user: person._id, items: [] });
        }

        const existingItem = cart.items.find(
            i => i.inventory.toString() === inventoryId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                inventory: inventoryId,
                perfumeName: inventory.perfume.name,
                brand: inventory.perfume.brand,
                image: inventory.perfume.images,
                size: inventory.size,
                quantity,
                priceAtTime: inventory.sellingPrice,
                sku: inventory.sku
            });
        }

        cart.totalAmount = cart.items.reduce(
            (sum, i) => sum + i.priceAtTime * i.quantity,
            0
        );

        await cart.save();

        res.json({ success: true, cartCount: cart.items.length });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
router.get("/:phone", async (req, res) => {
    try {
        console.log("Get cart request for phone:", req.params.phone);
        const { phone } = req.params;
        const person = await User.findOne({ phone });
        console.log("Found user:", person);
        if (!person) return res.status(404).json({ message: "User not found" });    
        const cart = await Cart.findOne({ user: person._id });
        console.log("Found cart:", cart);
        if (!cart) return res.json({ items: [], total: 0 });
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    } 
});

module.exports = router;
