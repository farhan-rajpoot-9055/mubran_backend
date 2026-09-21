import mongoose from 'mongoose';

let cached = globalThis.__mongoose;

if (!cached) {
  cached = globalThis.__mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add your MongoDB Atlas connection string.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 15000,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};

export const disconnectDB = async () => {
  cached.conn = null;
  cached.promise = null;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export default connectDB;
