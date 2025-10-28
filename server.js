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
const paymentRoutes = require("./routes/paymentRoutes");
const setupRoutes = require('./routes/setupRoutes');

// Import New Collector Functionality Routes
const collectorAuthRoutes = require("./routes/collectorAuthRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const statementRoutes = require("./routes/statementRoutes");
const collectorAppRoutes = require("./routes/collectorAppRoutes"); // Add this line

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

// API Routes - UPDATED WITH COLLECTOR FUNCTIONALITY
app.use("/api/auth", authRoutes); // Admin authentication
app.use("/api/auth/customer", customerAuthRoutes); // Customer authentication
app.use("/api/auth/collector", collectorAuthRoutes); // Collector authentication

app.use("/api/collectors", collectorRoutes); // Admin collector management
app.use("/api/collector", collectorAppRoutes); // Collector app functionality ← Add this line
app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/plans", planRoutes);
app.use('/api/payments', paymentRoutes);

// New Collector Functionality Routes
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/statements', statementRoutes);

app.use('/api/setup', setupRoutes);

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
    console.log(`Collector functionality routes added:
    - /api/auth/collector (Collector authentication)
    - /api/collector (Collector app functionality)
    - /api/withdrawals (Withdrawal management)
    - /api/feedback (Feedback management)
    - /api/statements (Statement management)
    `);
});