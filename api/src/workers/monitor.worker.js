import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import Monitor from '../models/Monitor.js';
import PingLog from '../models/PingLog.js';
import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { runCheckWithRetries } from '../services/check.service.js';
import { sendOutageAlert, sendRecoveryAlert } from '../services/email.service.js';

dotenv.config();

export const processMonitorCheck = async (monitorOrId) => {
  let monitor = monitorOrId;
  if (typeof monitorOrId === 'string' || monitorOrId instanceof String || !monitorOrId.userId?.email) {
    monitor = await Monitor.findById(monitorOrId?._id || monitorOrId).populate('userId', 'email');
  }

  if (!monitor || monitor.status === 'PAUSED') {
    return null;
  }

  // Run the check with 3-retry logic
  const result = await runCheckWithRetries(monitor);

  // 1. Log the Ping (Time-Series Data)
  await PingLog.create({
    monitorId: monitor._id,
    status: result.status,
    responseTimeMs: result.responseTime,
    errorDetails: result.details,
  });

  console.log(`[Check] Evaluated ${monitor.name} (${monitor.type}) - Status: ${result.status} | Response: ${result.responseTime}ms`);

  // 2. State Transition Detection & Alerting
  const previousStatus = monitor.status;
  const currentStatus = result.status;

  if (previousStatus !== 'PAUSED' && previousStatus !== currentStatus) {
    const userEmail = monitor.userId?.email || 'admin@pulseguard.io';

    if (currentStatus === 'DOWN') {
      await Incident.create({
        monitorId: monitor._id,
        cause: result.details,
        startedAt: new Date(),
      });
      await sendOutageAlert(userEmail, monitor.name, result.details, new Date());
    } else if (currentStatus === 'UP' && previousStatus === 'DOWN') {
      const openIncident = await Incident.findOne({
        monitorId: monitor._id,
        resolvedAt: null,
      }).sort({ startedAt: -1 });

      let downtimeMinutes = 0;
      if (openIncident) {
        openIncident.resolvedAt = new Date();
        await openIncident.save();
        downtimeMinutes = Math.round((openIncident.resolvedAt - openIncident.startedAt) / 60000);
      }
      await sendRecoveryAlert(userEmail, monitor.name, downtimeMinutes);
    }
  }

  monitor.status = currentStatus;
  monitor.lastPingAt = new Date();
  await monitor.save();

  return {
    monitorId: monitor._id,
    name: monitor.name,
    status: currentStatus,
    responseTime: result.responseTime,
  };
};

export const startWorker = () => {
  console.log('[Worker] Starting BullMQ Worker...');

  const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  connection.on('error', (err) => {
    console.warn(`[Worker] Redis connection error: ${err.message}`);
  });

  const worker = new Worker('monitor-checks', async (job) => {
    await processMonitorCheck(job.data.monitorId);
  }, {
    connection,
    concurrency: 10,
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed fundamentally: ${err.message}`);
  });

  return worker;
};
