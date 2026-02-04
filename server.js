const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// ---------------------------------------------------------------------------------------------------------------------------------------

dotenv.config({ quiet: true });
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------------------------------------------------------------------

const User = require("./models/user")
const PerfumeMaster = require("./models/perfumeMaster")
const PerfumeInventory = require("./models/perfumeInventory")

// ---------------------------------------------------------------------------------------------------------------------------------------

app.use(express.json());
app.use(cors())
app.listen(PORT, () => {console.log(`Server running on http://localhost:${PORT}`)});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch users for user management

app.get("/api/users", async (req, res) => {

    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users : ', err);
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Delete users for user management

app.delete("/api/users/:id", async (req, res) => {

    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error('Error deleting user : ', err);
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Create users for user management

app.post("/api/users", async (req, res) => {

    try {
        const user = new User(req.body);
        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Error creating user : ', err);
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update users for user management

app.put("/api/users/:id", async (req, res) => {

    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {return res.status(404).json({ message: "User not found" })}
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------


app.get("/api/inventory", async (req, res) => {
    try {
        const inventory = await PerfumeInventory
            .find()
            .populate("perfume")  
            .sort({ createdAt: -1 });

        res.json(inventory);
    } catch (err) {
        console.error("Error fetching inventory:", err);
        res.status(500).json({ message: err.message });
    }
});

