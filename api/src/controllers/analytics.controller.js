import mongoose from 'mongoose';
import PingLog from '../models/PingLog.js';
import Monitor from '../models/Monitor.js';

// @desc    Get analytics for a specific monitor
// @route   GET /api/v1/analytics/:monitorId
// @access  Private
export const getMonitorAnalytics = async (req, res, next) => {
  try {
    const { monitorId } = req.params;

    if (!mongoose.isValidObjectId(monitorId)) {
      return res.status(400).json({ success: false, message: 'Invalid monitor ID format' });
    }

    // Verify ownership
    const monitor = await Monitor.findOne({ _id: monitorId, userId: req.user.id });
    if (!monitor) {
      return res.status(404).json({ success: false, message: 'Monitor not found' });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Calculate 30-day uptime percentage
    const thirtyDayLogs = await PingLog.aggregate([
      { $match: { monitorId: monitor._id, createdAt: { $gte: last30Days } } },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    let upCount = 0;
    let downCount = 0;
    thirtyDayLogs.forEach(log => {
      if (log._id === 'UP') upCount = log.count;
      if (log._id === 'DOWN') downCount = log.count;
    });

    const totalChecks = upCount + downCount;
    const uptimePercentage = totalChecks === 0 ? 100 : ((upCount / totalChecks) * 100).toFixed(2);

    // 2. Calculate 24h average response time & get chart data
    const avgResult = await PingLog.aggregate([
      { $match: { monitorId: monitor._id, createdAt: { $gte: last24Hours }, status: 'UP' } },
      { $group: { _id: null, avg: { $avg: '$responseTimeMs' }, count: { $sum: 1 } } }
    ]);

    const avg24h = avgResult.length > 0 ? Math.round(avgResult[0].avg) : 0;

    // Count all checks in the last 24h (both UP and DOWN)
    const totalLogs24h = await PingLog.countDocuments({
      monitorId: monitor._id,
      createdAt: { $gte: last24Hours }
    });

    let chartData = [];

    if (totalLogs24h > 0 && totalLogs24h <= 60) {
      // For immediate granular view: return recent individual checks including 0ms outages
      const recentLogs = await PingLog.find({
        monitorId: monitor._id,
        createdAt: { $gte: last24Hours }
      })
        .sort({ createdAt: 1 })
        .limit(60);

      chartData = recentLogs.map(item => ({
        time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.round(item.responseTimeMs || 0),
        status: item.status,
        fullDate: item.createdAt
      }));
    } else if (totalLogs24h > 60) {
      // Grouping by hour for larger datasets
      const hourlyData = await PingLog.aggregate([
        { $match: { monitorId: monitor._id, createdAt: { $gte: last24Hours } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
              hour: { $hour: '$createdAt' }
            },
            avgResponseTime: { $avg: '$responseTimeMs' },
            date: { $first: '$createdAt' }
          }
        },
        { $sort: { 'date': 1 } }
      ]);

      chartData = hourlyData.map(item => ({
        time: `${String(item._id.hour).padStart(2, '0')}:00`,
        responseTime: Math.round(item.avgResponseTime || 0),
        fullDate: item.date
      }));
    }

    // 3. Fetch recent execution logs for audit inspection table
    const recentLogs = await PingLog.find({ monitorId: monitor._id })
      .sort({ createdAt: -1 })
      .limit(25);

    const formattedLogs = recentLogs.map(log => ({
      id: log._id,
      status: log.status,
      responseTime: log.responseTimeMs,
      details: log.errorDetails || (log.status === 'UP' ? 'HTTP 200 OK' : 'Outage detected'),
      timestamp: log.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        uptimePercentage: parseFloat(uptimePercentage),
        avgResponseTime24h: avg24h,
        chartData,
        logs: formattedLogs
      }
    });

  } catch (error) {
    next(error);
  }
};
