const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");
const connectDB = require("./config/database");

// Import Routes
const collectorRoutes = require("./routes/collectors");
const customerRoutes = require("./routes/customers");
const accountRoutes = require("./routes/accounts");
const planRoutes = require("./routes/plans");
const authRoutes = require("./routes/auth"); // Admin auth routes
const customerAuthRoutes = require("./routes/customerAuth"); // Customer auth routes

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

// API Routes - CLEANED UP VERSION
app.use("/api/auth", authRoutes); // Admin authentication
app.use("/api/auth/customer", customerAuthRoutes); // Customer authentication
app.use("/api/collectors", collectorRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/plans", planRoutes);

// REMOVE these duplicate lines:
// app.use('/api/users', require('./routes/users')); // ← Remove if not needed
// app.use('/api/auth/user', require('./routes/customerAuth')); // ← This is duplicate!

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});