import mongoose from 'mongoose';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  let rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

  if (!rawUri) {
    for (const [key, val] of Object.entries(process.env)) {
      if (/mongo/i.test(key) && typeof val === 'string' && val.includes('mongodb')) {
        rawUri = val;
        break;
      }
    }
  }

  if (!rawUri) {
    const errorMsg = 'MONGO_URI (or MONGODB_URI) is not configured in environment variables';
    console.error(`[DB] Configuration Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  rawUri = rawUri.trim().replace(/^["']|["']$/g, '');

  // Ensure database name is included in MongoDB Atlas connection string
  if (rawUri.includes('.mongodb.net') && !rawUri.split('.mongodb.net/')[1]?.split('?')[0]) {
    const hasQuery = rawUri.includes('?');
    if (hasQuery) {
      rawUri = rawUri.replace('.mongodb.net/?', '.mongodb.net/pulseguard?');
    } else {
      rawUri = `${rawUri.replace(/\/+$/, '')}/pulseguard?retryWrites=true&w=majority`;
    }
  }

  try {
    const conn = await mongoose.connect(rawUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB] MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};
