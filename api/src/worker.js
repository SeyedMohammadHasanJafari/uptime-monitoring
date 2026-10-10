import { connectDB } from './config/db.js';
import './models/User.js';
import './models/Monitor.js';
import './models/PingLog.js';
import './models/Incident.js';
import { startWorker } from './workers/monitor.worker.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

let workerInstance = null;

const init = async () => {
  try {
    await connectDB();
    workerInstance = startWorker();
  } catch (error) {
    console.error('[Worker] Initialization Failed:', error);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`\n[Worker] Received ${signal}. Shutting down worker gracefully...`);
  try {
    if (workerInstance) {
      await workerInstance.close();
      console.log('[Worker] BullMQ worker stopped.');
    }
    await mongoose.connection.close();
    console.log('[Worker] Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Worker] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Worker] Unhandled Promise Rejection:', reason);
});

init();
