const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Order = require("../models/order");
const User = require("../models/user");

router.post("/checkout", async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: "User not found" });

        const cart = await Cart.findOne({ user: user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Create order
        const newOrder = new Order({
            orderNumber: "ORD" + Date.now(),
            user: user._id,
            items: cart.items.map(item => ({
                inventory: item.inventory,
                perfumeName: item.perfumeName,
                size: item.size,
                quantity: item.quantity,
                price: item.priceAtTime,
                subtotal: item.priceAtTime * item.quantity
            })),
            totalAmount: cart.totalAmount,
            shippingAddress: user.address,
            paymentStatus: "Pending"
        });

        await newOrder.save();

        // Clear cart
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.json({ success: true, message: "Order placed successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

module.exports = router;

