
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const aiRoutes = require("./aiRoutes");

console.log("RESOLVED PATH:", require.resolve("./aiRoutes"));
console.log("IMPORTED ROUTER TYPE:", typeof aiRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));
// Serve ShopBug website
app.use("/shopbug", express.static(path.join(__dirname, "../../shopbug")));

app.use("/api/ai", aiRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to TestNova AI Website Testing Platform!");
});

// Health check route
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "TestNova backend is running successfully!"
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`TestNova server running at http://localhost:${PORT}`);
});

console.log("SERVER FILE EXECUTION COMPLETED");