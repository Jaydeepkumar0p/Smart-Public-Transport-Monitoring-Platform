const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['delay', 'breakdown', 'route_change', 'overcrowding', 'emergency', 'info'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  stop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  affectedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  isActive: { type: Boolean, default: true },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: Date
}, { timestamps: true });

alertSchema.index({ isActive: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
