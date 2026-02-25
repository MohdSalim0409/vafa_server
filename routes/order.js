const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Order = require("../models/order");
const User = require("../models/user");
const Payment = require("../models/payment");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Get all orders for a user

router.get("/user/:phone", async (req, res) => {

    try {
        const { phone } = req.params;
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: "User not found" });
        const orders = await Order.find({ user: user._id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch all orders for admin

router.get("/admin", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

router.post("/checkout", async (req, res) => {
    try {

        const { phone, shippingAddress, paymentMethod } = req.body;

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: "User not found" });

        const cart = await Cart.findOne({ user: user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 1️⃣ Create Order
        const newOrder = new Order({
            orderNumber: "ORD" + Date.now(),
            user: user._id,
            items: cart.items.map((item) => ({
                inventory: item.inventory,
                perfumeName: item.perfumeName,
                size: item.size,
                quantity: item.quantity,
                price: item.priceAtTime,
                subtotal: item.priceAtTime * item.quantity,
            })),
            totalAmount: cart.totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
            orderStatus: "Placed"
        });

        await newOrder.save();

        // 2️⃣ Create Payment Record
        const newPayment = new Payment({
            order: newOrder._id,
            transactionId: paymentMethod === "COD" ? null : "TXN" + Date.now(),
            method: paymentMethod,
            amount: cart.totalAmount,
            status: paymentMethod === "COD" ? "Pending" : "Success",
            paidAt: paymentMethod === "COD" ? null : new Date()
        });

        await newPayment.save();

        // 3️⃣ Link Payment to Order
        newOrder.payment = newPayment._id;
        await newOrder.save();

        // 4️⃣ Clear Cart
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.json({ success: true, message: "Order & Payment created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Checkout failed" });
    }
});

// PUT - Update Order Status (Admin)
router.put("/admin/:id/status", async (req, res) => {
    try {
        const { orderStatus } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { orderStatus },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(updatedOrder);

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Server Error" });
    }
});
// ---------------------------------------------------------------------------------------------------------------------------------------

module.exports = router;
