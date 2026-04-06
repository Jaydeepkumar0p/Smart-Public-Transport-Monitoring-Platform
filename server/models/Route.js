const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['bus', 'train', 'metro', 'tram'],
    required: true
  },
  color: { type: String, default: '#3B82F6' },
  description: String,
  stops: [{
    stop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
    sequence: Number,
    distanceFromPrev: Number, // km
    estimatedTravelTime: Number // minutes
  }],
  schedule: [{
    departureTime: String, // "HH:MM"
    arrivalTime: String,
    days: [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }]
  }],
  totalDistance: Number, // km
  estimatedDuration: Number, // minutes
  frequency: Number, // minutes between trips
  status: {
    type: String,
    enum: ['active', 'suspended', 'modified'],
    default: 'active'
  },
  fare: {
    base: Number,
    perKm: Number,
    currency: { type: String, default: 'INR' }
  },
  polyline: [{ lat: Number, lng: Number }],
  stats: {
    avgDelay: { type: Number, default: 0 },
    avgOccupancy: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    onTimePercent: { type: Number, default: 100 }
  }
}, { timestamps: true });

routeSchema.index({ routeId: 1 });
routeSchema.index({ type: 1 });

module.exports = mongoose.model('Route', routeSchema);
