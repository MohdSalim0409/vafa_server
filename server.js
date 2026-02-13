const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const multer = require("multer");
const perfumeRoutes = require("./routes/perfume");
const userDirectoryRoutes = require("./routes/userDirectory");
const User = require("./models/User"); 
const perfumeMasterRoutes = require("./routes/perfumeMaster");

// ---------------------------------------------------------------------------------------------------------------------------------------

dotenv.config({ quiet: true });
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------------------------------------------------------------------

const PerfumeMaster = require("./models/perfumeMaster")

// ---------------------------------------------------------------------------------------------------------------------------------------

app.use(express.json());
app.use(cors())
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) });
app.use("/uploads", express.static("uploads"));
app.use("/api/inventory", perfumeRoutes);
app.use("/api/userDirectory", userDirectoryRoutes);
app.use("/api/perfumeMasters", perfumeMasterRoutes);

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });




// ---------------------------------------------------------------------------------------------------------------------------------------

// Register route for user registration

app.post("/api/users/register", async (req, res) => {

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
