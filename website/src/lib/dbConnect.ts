import mongoose from 'mongoose';

// MongoDB connection string - use environment variable in production
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mtp_collective';

// Global variable to maintain connection across hot reloads in development
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Initialize global mongoose variable if it doesn't exist
if (!global.mongoose) {
  global.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connect to MongoDB database
 */
export async function dbConnect() {
  // If connection already exists, return it
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // If connection is in process, wait for it
  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Create new connection
    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        throw error;
      });
  }

  // Assign connection to cache
  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

export default dbConnect;
