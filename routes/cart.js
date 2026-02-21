const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const PerfumeInventory = require("../models/perfumeInventory");
const User = require("../models/user");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Add to cart

router.post("/add", async (req, res) => {
    
    try {

        const { userId, inventoryId, quantity } = req.body;
        const person = await User.findOne({ phone: userId });
        const inventory = await PerfumeInventory.findById(inventoryId).populate("perfume");

        if (!inventory) return res.status(404).json({ message: "Item not found" });

        let cart = await Cart.findOne({ user: person._id });

        if (!cart) {
            cart = new Cart({ user: person._id, items: [] });
        }

        const existingItem = cart.items.find((i) => i.inventory.toString() === inventoryId);

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
                sku: inventory.sku,
            });
        }

        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: "items.inventory",
            populate: { path: "perfume" },
        });

        res.json({
            success: true,
            items: updatedCart.items,
            cartCount: updatedCart.items.length,
            totalAmount: updatedCart.totalAmount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

router.get("/:phone", async (req, res) => {

    try {

        const { phone } = req.params;
        const person = await User.findOne({ phone });
        if (!person) return res.status(404).json({ message: "User not found" });
        const cart = await Cart.findOne({ user: person._id }).populate({
            path: "items.inventory",
            populate: { path: "perfume" },
        });
        if (!cart) return res.json({ items: [], total: 0 });
        res.json(cart);
    } catch (err) {
        console.error("error fetching cart:", err);
        res.status(500).json(err);
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Remove item from cart

router.delete("/remove/:phone/:inventoryId", async (req, res) => {

    try {

        const { phone, inventoryId } = req.params;
        const person = await User.findOne({ phone });
        if (!person) return res.status(404).json({ message: "User not found" });
        const cart = await Cart.findOne({ user: person._id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        cart.items = cart.items.filter((item) => item.inventory.toString() !== inventoryId);
        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);

        await cart.save();

        res.json({
            success: true, items: cart.items,
            cartCount: cart.items.length,
            totalAmount: cart.totalAmount,
        });
    } catch (err) {
        console.error("error removing item from cart:", err);
        res.status(500).json({ message: "Remove failed" });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update cart item quantity

router.put("/update", async (req, res) => {

    try {

        const { phone, inventoryId, action } = req.body;

        const person = await User.findOne({ phone });
        if (!person) return res.status(404).json({ message: "User not found" });

        const cart = await Cart.findOne({ user: person._id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const itemIndex = cart.items.findIndex((i) => i.inventory.toString() === inventoryId.toString());

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (action === "increase") {
            cart.items[itemIndex].quantity += 1;
        }

        if (action === "decrease") {
            cart.items[itemIndex].quantity -= 1;
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        }

        // Recalculate total
        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);
        await cart.save();

        res.json({
            success: true,  items: cart.items,
            cartCount: cart.items.length,
            totalAmount: cart.totalAmount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;