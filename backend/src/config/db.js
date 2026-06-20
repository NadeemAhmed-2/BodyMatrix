const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Disable command buffering so queries fail immediately if disconnected instead of hanging
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness', {
      serverSelectionTimeoutMS: 5000 // fail connection attempt after 5 seconds instead of 30 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
