const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn("⚠️  [Notice] MONGO_URI not found in environment variables.");
    console.warn("ℹ️  Running with local JSON fallback store. When deploying to Render, set MONGO_URI from MongoDB Atlas.");
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn("ℹ️  Continuing with fallback local data store so server remains operational.");
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
