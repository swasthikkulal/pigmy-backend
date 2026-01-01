const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://swasthik126_db_user:swasthik126_db_user@instagram.xnjjk94.mongodb.net/?appName=instagram", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
};

module.exports = connectDB;
