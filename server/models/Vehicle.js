const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 }
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['bus', 'train', 'metro', 'tram'],
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    seated: { type: Number, required: true },
    standing: { type: Number, default: 0 }
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'maintenance', 'offline', 'delayed'],
    default: 'idle'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  currentLocation: locationSchema,
  locationHistory: [locationSchema],
  driver: {
    name: String,
    id: String,
    contact: String
  },
  iotSensorData: {
    engineStatus: { type: String, enum: ['on', 'off'], default: 'off' },
    fuelLevel: { type: Number, min: 0, max: 100 },
    temperature: Number,
    doorStatus: { type: String, enum: ['open', 'closed'], default: 'closed' },
    gpsAccuracy: Number,
    lastPing: { type: Date, default: Date.now }
  },
  arrivalPredictions: [{
    stopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
    stopName: String,
    predictedArrival: Date,
    estimatedMinutes: Number
  }],
  delayMinutes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

vehicleSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ status: 1 });

vehicleSchema.virtual('occupancyPercent').get(function() {
  const total = this.capacity.seated + this.capacity.standing;
  return total > 0 ? Math.round((this.currentOccupancy / total) * 100) : 0;
});

vehicleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
