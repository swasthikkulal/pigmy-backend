const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");
const connectDB = require("./config/database");

// Import Routes
// const userRoutes = require("./routes/userRoutes");
const collectorRoutes = require("./routes/collectors");
const customerRoutes = require("./routes/customers");
const accountRoutes = require("./routes/accounts");
const planRoutes = require("./routes/plans");

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();

// Routes
app.get("/", async (req, res) => {
    console.log("routes are working");
    res.send("Routes are working! 🚀");
});

// app.use("/api/user", userRoutes);
app.use("/api/collectors", collectorRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/plans", planRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// Handle 404 - Fixed wildcard route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});