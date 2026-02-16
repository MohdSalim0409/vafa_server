const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// ---------------------------------------------------------------------------------------------------------------------------------------

const authRoutes = require("./routes/authentication");
const perfumeRoutes = require("./routes/perfume");
const userDirectoryRoutes = require("./routes/userDirectory");
const perfumeMasterRoutes = require("./routes/perfumeMaster");
const cartRoutes = require("./routes/cart");

// ---------------------------------------------------------------------------------------------------------------------------------------

dotenv.config({ quiet: true });
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------------------------------------------------------------------

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) });

// ---------------------------------------------------------------------------------------------------------------------------------------

app.use("/api/inventory", perfumeRoutes);
app.use("/api/userDirectory", userDirectoryRoutes);
app.use("/api/perfumeMasters", perfumeMasterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
// ---------------------------------------------------------------------------------------------------------------------------------------