const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user by phone number
router.get('/phone/:phone', async (req, res) => {

    console.log(phone)
    try {
        const user = await User.findOne({ phone: req.params.phone });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user by phone number
router.put('/phone/:phone', async (req, res) => {
    try {
        const { name, address } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { phone: req.params.phone },
            { name, address },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;