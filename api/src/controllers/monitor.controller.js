import mongoose from 'mongoose';
import Monitor from '../models/Monitor.js';
import PingLog from '../models/PingLog.js';
import Incident from '../models/Incident.js';
import { sendRecoveryAlert } from '../services/email.service.js';
import { addMonitorJob, removeMonitorJob } from '../queues/monitor.queue.js';
import { processMonitorCheck } from '../workers/monitor.worker.js';

// @desc    Get all monitors for logged in user
// @route   GET /api/v1/monitors
// @access  Private
export const getMonitors = async (req, res, next) => {
  try {
    const monitors = await Monitor.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: monitors.length, data: monitors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single monitor
// @route   GET /api/v1/monitors/:id
// @access  Private
export const getMonitor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
    }
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    res.status(200).json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new monitor
// @route   POST /api/v1/monitors
// @access  Private
export const createMonitor = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.userId = req.user.id;

    // Validate specific fields based on type
    const { type, target, port, keyword } = req.body;
    
    if (type !== 'HEARTBEAT' && !target) {
        return res.status(400).json({ success: false, message: 'Target URL/IP is required for this monitor type' });
    }
    if (type === 'TCP' && !port) {
        return res.status(400).json({ success: false, message: 'Port is required for TCP monitor' });
    }
    if (type === 'KEYWORD' && !keyword) {
        return res.status(400).json({ success: false, message: 'Keyword is required for Keyword monitor' });
    }

    const monitor = await Monitor.create(req.body);

    // Schedule in background
    await addMonitorJob(monitor);

    res.status(201).json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update monitor
// @route   PUT /api/v1/monitors/:id
// @access  Private
export const updateMonitor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
    }
    let monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });

    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    // Don't allow changing userId
    delete req.body.userId;

    monitor = await Monitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update job in background
    await addMonitorJob(monitor);

    res.status(200).json({ success: true, data: monitor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete monitor
// @route   DELETE /api/v1/monitors/:id
// @access  Private
export const deleteMonitor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
    }
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    // Remove job from queue
    await removeMonitorJob(monitor._id.toString());

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Pause/Resume monitor
// @route   PATCH /api/v1/monitors/:id/toggle-status
// @access  Private
export const toggleMonitorStatus = async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
      }
      const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });
  
      if (!monitor) {
        return res.status(404).json({ success: false, message: 'Monitor not found' });
      }
  
      // Toggle between PAUSED and UP (or a tentative state, handled by worker later)
      const newStatus = monitor.status === 'PAUSED' ? 'UP' : 'PAUSED';
      monitor.status = newStatus;
      await monitor.save();
  
      if (newStatus === 'PAUSED') {
        await removeMonitorJob(monitor._id.toString());
      } else {
        await addMonitorJob(monitor);
      }

      res.status(200).json({ success: true, data: monitor });
    } catch (error) {
      next(error);
    }
  };

// @desc    Receive external heartbeat ping
// @route   GET / POST /api/v1/monitors/:id/ping
// @access  Public
export const pingMonitor = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
    }
    const monitor = await Monitor.findById(req.params.id).populate('userId', 'email');

    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    if (monitor.type !== 'HEARTBEAT') {
      return res.status(400).json({ success: false, message: 'Ping is only supported for HEARTBEAT monitors' });
    }

    const previousStatus = monitor.status;
    monitor.lastPingAt = new Date();
    monitor.status = 'UP';
    await monitor.save();

    // Log the Ping
    await PingLog.create({
      monitorId: monitor._id,
      status: 'UP',
      responseTimeMs: 1,
      errorDetails: 'Heartbeat ping received',
    });

    // If monitor was DOWN, resolve open incident and send recovery notification
    if (previousStatus === 'DOWN') {
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

      if (monitor.userId?.email) {
        await sendRecoveryAlert(monitor.userId.email, monitor.name, downtimeMinutes);
      }
    }

    res.status(200).json({
      success: true,
      message: `Heartbeat ping received for ${monitor.name}`,
      timestamp: monitor.lastPingAt,
      status: monitor.status,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run scheduled health checks across active monitors (Serverless / Cron webhook)
// @route   GET / POST /api/v1/monitors/cron/check
// @access  Public / Protected by optional CRON_SECRET
export const runCronChecks = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const authHeader = req.headers.authorization;
      const queryKey = req.query.key;
      if (authHeader !== `Bearer ${secret}` && queryKey !== secret) {
        return res.status(401).json({ success: false, message: 'Unauthorized cron invocation' });
      }
    }

    const monitors = await Monitor.find({ status: { $ne: 'PAUSED' } }).populate('userId', 'email');
    const results = await Promise.allSettled(monitors.map((m) => processMonitorCheck(m)));

    const summary = results.map((r, i) => ({
      name: monitors[i].name,
      status: r.status === 'fulfilled' ? r.value?.status : 'ERROR',
      error: r.status === 'rejected' ? r.reason?.message : undefined,
    }));

    res.status(200).json({
      success: true,
      count: monitors.length,
      timestamp: new Date(),
      results: summary,
    });
  } catch (error) {
    next(error);
  }
};
