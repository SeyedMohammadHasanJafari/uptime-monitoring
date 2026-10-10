import mongoose from 'mongoose';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';
import PingLog from '../models/PingLog.js';

// @desc    Get public status page data for a company or user ID
// @route   GET /api/v1/status/:identifier
// @access  Public
export const getPublicStatus = async (req, res, next) => {
  try {
    const { companyName: identifier } = req.params;
    
    // Find user by ObjectId or companyName (case insensitive)
    let user = null;
    if (mongoose.isValidObjectId(identifier)) {
      user = await User.findById(identifier);
    }
    if (!user && identifier) {
      const sanitizedIdentifier = String(identifier).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ companyName: { $regex: new RegExp(`^${sanitizedIdentifier}$`, 'i') } });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'Status page not found for this identifier' });
    }

    // Find all public monitors
    const monitors = await Monitor.find({ userId: user._id, isPublic: true }).select('name type status interval');

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Build 90-day history for each monitor
    const monitorsWithHistory = await Promise.all(
      monitors.map(async (monitor) => {
        // Aggregate daily logs for the last 90 days
        const dailyLogs = await PingLog.aggregate([
          {
            $match: {
              monitorId: monitor._id,
              createdAt: { $gte: ninetyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              total: { $sum: 1 },
              up: {
                $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] },
              },
            },
          },
        ]);

        const dailyMap = {};
        let totalAllChecks = 0;
        let totalUpChecks = 0;

        dailyLogs.forEach((day) => {
          dailyMap[day._id] = day.total > 0 ? Math.round((day.up / day.total) * 100) : 100;
          totalAllChecks += day.total;
          totalUpChecks += day.up;
        });

        // Generate 90 daily bars (from 89 days ago up to today)
        const history = Array.from({ length: 90 }).map((_, i) => {
          const dateStr = new Date(now.getTime() - (89 - i) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          // If there are real logs for that date, use calculated uptime. Otherwise, default 100%
          const uptime = dailyMap[dateStr] !== undefined ? dailyMap[dateStr] : 100;
          return {
            date: dateStr,
            uptime,
          };
        });

        const overallUptime =
          totalAllChecks > 0
            ? parseFloat(((totalUpChecks / totalAllChecks) * 100).toFixed(2))
            : 100;

        return {
          _id: monitor._id,
          name: monitor.name,
          type: monitor.type,
          status: monitor.status,
          history,
          uptime90Days: overallUptime,
        };
      })
    );

    const hasAnyOutage = monitors.some((m) => m.status === 'DOWN');
    const isPausedOnly = monitors.length > 0 && monitors.every((m) => m.status === 'PAUSED');

    let globalStatus = 'All Systems Operational';
    if (monitors.length === 0) {
      globalStatus = 'No Public Monitors Configured';
    } else if (hasAnyOutage) {
      globalStatus = 'Partial System Outage';
    } else if (isPausedOnly) {
      globalStatus = 'Maintenance Mode';
    }

    res.status(200).json({
      success: true,
      data: {
        companyName: user.companyName || 'PulseGuard',
        monitors: monitorsWithHistory,
        globalStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
