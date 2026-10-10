import express from 'express';
import {
  getMonitors,
  getMonitor,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  toggleMonitorStatus,
  pingMonitor,
  runCronChecks
} from '../controllers/monitor.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { sendTestEmail } from '../services/email.service.js';

const router = express.Router();

// Public / Webhook Cron endpoint for automated uptime checks
router.route('/cron/check')
  .get(runCronChecks)
  .post(runCronChecks);

// Public Heartbeat ping endpoint for external crons
router.route('/:id/ping')
  .get(pingMonitor)
  .post(pingMonitor);

// Apply protection to all other monitor routes
router.use(protect);

// Test alert email dispatch
router.post('/test-email', async (req, res) => {
  const targetEmail = req.body?.email || req.user?.email || 'admin@pulseguard.io';
  const result = await sendTestEmail(targetEmail);
  return res.json({
    success: result.success,
    message: result.success ? `Alert email successfully dispatched to ${targetEmail}` : 'Email dispatch failed',
    previewUrl: result.previewUrl,
    error: result.error,
  });
});

router.route('/')
  .get(getMonitors)
  .post(createMonitor);

router.route('/:id')
  .get(getMonitor)
  .put(updateMonitor)
  .delete(deleteMonitor);

router.patch('/:id/toggle-status', toggleMonitorStatus);

export default router;
