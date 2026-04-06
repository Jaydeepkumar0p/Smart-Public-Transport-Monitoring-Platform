const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  code: { type: String, unique: true },
  type: {
    type: String,
    enum: ['bus_stop', 'train_station', 'metro_station', 'interchange'],
    default: 'bus_stop'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
    landmark: String
  },
  amenities: {
    shelter: { type: Boolean, default: false },
    seating: { type: Boolean, default: false },
    realTimeDisplay: { type: Boolean, default: false },
    accessibility: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false }
  },
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  status: {
    type: String,
    enum: ['operational', 'closed', 'under_maintenance'],
    default: 'operational'
  },
  currentVehicles: [{
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    arrivalTime: Date,
    departureTime: Date
  }],
  stats: {
    avgWaitTime: Number,
    dailyPassengers: { type: Number, default: 0 },
    peakHour: String
  }
}, { timestamps: true });

stopSchema.index({ 'location.lat': 1, 'location.lng': 1 });
stopSchema.index({ stopId: 1 });

module.exports = mongoose.model('Stop', stopSchema);
