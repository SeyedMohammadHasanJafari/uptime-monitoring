import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Monitor type is required'],
      enum: ['HTTP', 'KEYWORD', 'SSL', 'TCP', 'HEARTBEAT'],
    },
    target: {
      type: String,
      required: function() {
        return this.type !== 'HEARTBEAT';
      },
      trim: true,
    },
    port: {
      type: Number,
      required: function() {
        return this.type === 'TCP';
      },
      min: 1,
      max: 65535,
    },
    keyword: {
      type: String,
      required: function() {
        return this.type === 'KEYWORD';
      },
      trim: true,
    },
    interval: {
      type: Number,
      required: [true, 'Check interval is required'],
      enum: [1, 3, 5], // 1, 3, or 5 minutes
      default: 3,
    },
    status: {
      type: String,
      enum: ['UP', 'DOWN', 'PAUSED'],
      default: 'UP',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastPingAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Monitor = mongoose.model('Monitor', monitorSchema);
export default Monitor;
