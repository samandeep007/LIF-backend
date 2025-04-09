import mongoose from 'mongoose';

// Custom error logging function for detailed DB errors
const logDbError = (error) => {
  console.error('MongoDB Connection Error Details:');
  console.error(`- Message: ${error.message}`);
  console.error(`- Code: ${error.code || 'N/A'}`);
  console.error(`- Name: ${error.name || 'N/A'}`);
  if (error.stack) {
    console.error(`- Stack: ${error.stack}`);
  }
};

// MongoDB connection with retry logic
const connectDB = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000 // Timeout for initial connection
      });

      // Log successful connection
      console.log('Connected to MongoDB');

      // Handle connection errors after initial connect
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error after initial connect:', err.message);
      });

      // Handle disconnection
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(() => connectDB(retries, delay), delay);
      });

      return; // Exit if connection succeeds
    } catch (error) {
      logDbError(error);

      if (attempt === retries) {
        console.error(`Failed to connect to MongoDB after ${retries} attempts. Exiting...`);
        process.exit(1);
      }

      console.warn(`Retrying connection (${attempt}/${retries}) in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export { connectDB };