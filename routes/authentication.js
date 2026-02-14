const express = require("express");
const router = express.Router();
const  User = require("../models/User");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Register route for user registration

router.post("/register", async (req, res) => {

    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.log('Error during register : ', err)
        res.json({ success: false });
    }
});

// -----------------------------------------------------------------------------------------------------------------------------------

// Login route for user authentication

router.post("/login", async (req, res) => {

    try {

        const { phone, password } = req.body;
        const user = await User.findOne({ phone });
        if (!user) { return res.json({ success: false, message: "User not found" }) }
        if (user.password !== password) { return res.json({ success: false, message: "Wrong password" }) }
        res.json({
            success: true,
            user: {
                name: user.name,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });

    } catch (err) {
        console.log('Error logging in : ', err);
        res.status(500).json({ success: false });
    }
});

// -----------------------------------------------------------------------------------------------------------------------------------

module.exports = router;