const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config({ quite: true }); // load env
connectDB();     // connect mongodb

const app = express();
const PORT = process.env.PORT || 5000;
const User = require("./models/user")

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("MongoDB + Node.js Connected 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------------------------------------------------------------------------

// fatch user to frontend

app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

