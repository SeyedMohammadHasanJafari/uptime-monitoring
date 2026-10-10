import mongoose from 'mongoose';

const pingLogSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UP', 'DOWN'],
      required: true,
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    errorDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete logs older than 90 days to save space
// 90 days = 90 * 24 * 60 * 60 seconds = 7776000
pingLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const PingLog = mongoose.model('PingLog', pingLogSchema);
export default PingLog;
