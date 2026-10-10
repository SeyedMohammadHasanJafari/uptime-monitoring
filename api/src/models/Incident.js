import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    cause: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
