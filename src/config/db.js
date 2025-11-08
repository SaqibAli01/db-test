const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in env');

  // In serverless environments, check if we're already connected
  // But in Vercel, we might need to reconnect each time due to cold starts
  if (isConnected && !process.env.VERCEL_ENV) {
    console.log('Using existing database connection');
    return;
  }

  // If we're in a Vercel environment, always try to connect
  // as the connection state may not persist between requests
  if (process.env.VERCEL_ENV || !isConnected) {
    try {
      // Add connection options for better reliability
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });

      isConnected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      isConnected = false;
      throw error;
    }
  }
};

// Listen for connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  isConnected = false;
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose disconnected on app termination');
  process.exit(0);
});

module.exports = connectDB;