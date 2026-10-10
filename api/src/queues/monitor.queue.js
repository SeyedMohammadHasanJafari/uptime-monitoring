import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let connection = null;
let monitorQueue = null;

const getQueue = () => {
  if (monitorQueue) return monitorQueue;

  const redisUri = process.env.REDIS_URI;
  if (!redisUri && process.env.VERCEL) {
    return null;
  }

  try {
    connection = new IORedis(redisUri || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    connection.on('error', (err) => {
      console.warn(`[Queue] Redis connection warning: ${err.message}`);
    });

    monitorQueue = new Queue('monitor-checks', { connection });
    return monitorQueue;
  } catch (err) {
    console.warn(`[Queue] Failed to initialize BullMQ queue: ${err.message}`);
    return null;
  }
};

export const addMonitorJob = async (monitor) => {
  const monitorId = monitor._id.toString();

  // If paused, remove the scheduler
  if (monitor.status === 'PAUSED') {
    await removeMonitorJob(monitorId);
    return;
  }

  const queue = getQueue();
  if (!queue) {
    return;
  }

  try {
    // BullMQ v5/v6: upsertJobScheduler atomically handles creation/update
    await queue.upsertJobScheduler(
      monitorId,
      {
        every: monitor.interval * 60 * 1000,
      },
      {
        name: 'check-endpoint',
        data: { monitorId },
      }
    );
  } catch (error) {
    console.warn(`[Queue] Could not schedule job for ${monitorId}: ${error.message}`);
  }
};

export const removeMonitorJob = async (monitorId) => {
  const queue = getQueue();
  if (!queue) return;

  try {
    await queue.removeJobScheduler(monitorId.toString());
  } catch (error) {
    // If not found, ignore error
    console.warn(`[Queue] Job scheduler for monitor ${monitorId} not found or already removed`);
  }
};
