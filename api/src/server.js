import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import monitorRoutes from './routes/monitor.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import statusRoutes from './routes/status.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Load env vars
dotenv.config();

// Kick off DB connection in background without blocking module evaluation
connectDB().catch((err) => {
  console.warn('[Server] Initial background DB connection notice:', err.message);
});

const app = express();

// Security Middleware (allowing cross-origin resources)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Robust CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));

// Explicit CORS headers and preflight handling on every response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5000 : 20000,
  message: { success: false, message: 'Too many requests from this IP, please try again later' },
});
app.use('/api', limiter);

// Body parser
app.use(express.json());

// Base health route (Always returns 200 OK without requiring active DB)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'PulseGuard API is running...',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting_or_disconnected',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Ensure database connection for API routes with graceful error reporting
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS' || req.path === '/' || req.path === '/health') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Database connection error: ${err.message}. Please verify MONGO_URI in Vercel environment variables.`,
    });
  }
});

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes with /api/v1 prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/monitors', monitorRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/status', statusRoutes);

// Fallback mounts without /api/v1 prefix (in case frontend URL omits /api/v1)
app.use('/auth', authRoutes);
app.use('/monitors', monitorRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/status', statusRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server = null;
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('[Server] Database connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('[Server] Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

export { app };
export default app;
