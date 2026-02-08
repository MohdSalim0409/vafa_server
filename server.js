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
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) });

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch users for user management

app.get("/api/users", async (req, res) => {

    try {
        const users = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users : ', err);
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
        if (!user) { return res.status(404).json({ message: "User not found" }) }
        res.json(user);
    } catch (err) {
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

// Fetch inventory for invertory control

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

// ---------------------------------------------------------------------------------------------------------------------------------------

// Create inventory for invertory control

app.post("/api/inventory", async (req, res) => {
    const item = await PerfumeInventory.create(req.body);
    res.json(item);
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update inventory for invertory control

app.put("/api/inventory/:id", async (req, res) => {
    const item = await PerfumeInventory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(item);
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Delete Inventory for invertory control

app.delete("/api/inventory/:id", async (req, res) => {

    try {

        const item = await PerfumeInventory.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ message: "Inventory deleted successfully" });
    } catch (error) {
        console.error("Error deleting inventory item:", error);
        res.status(500).json({ message: error.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Fetch perfumes for perfume directory

app.get("/api/perfumes", async (req, res) => {

    try {
        const perfumes = await PerfumeMaster.find({ status: true });
        res.json(perfumes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Create perfumes for perfume directory

app.post("/api/perfumes", async (req, res) => {
    const perfume = await PerfumeMaster.create(req.body);
    res.json(perfume);
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update perfumes for perfume directory

app.put("/api/perfumes/:id", async (req, res) => {
    const perfume = await PerfumeMaster.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(perfume);
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// Delete perfumes for perfume directory

app.delete("/api/perfumes/:id", async (req, res) => {

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

// Register route for user registration

app.post("/api/users/register", async (req, res) => {

    try {
        const user = new User(req.body);
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
});

// -----------------------------------------------------------------------------------------------------------------------------------

// Login route for user authentication

app.post("/api/users/login", async (req, res) => {

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
