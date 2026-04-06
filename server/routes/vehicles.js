const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/vehicles - Get all vehicles
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, route, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (route) filter.route = route;

    const vehicles = await Vehicle.find(filter)
      .populate('route', 'routeId name color type')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastUpdated: -1 });

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / limit),
      vehicles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/vehicles/live - Get live vehicle locations
router.get('/live', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'active' })
      .select('vehicleId type status currentLocation route delayMinutes currentOccupancy capacity iotSensorData arrivalPredictions')
      .populate('route', 'routeId name color type');

    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/vehicles/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.id })
      .populate('route')
      .populate('arrivalPredictions.stopId');

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/vehicles - Create vehicle
router.post('/', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/vehicles/:id - Update vehicle
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.id },
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    ).populate('route', 'routeId name color');

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/vehicles/:id/location - Update vehicle location (IoT endpoint)
router.put('/:id/location', async (req, res) => {
  try {
    const { lat, lng, speed, heading, occupancy, sensorData } = req.body;
    const locationUpdate = { lat, lng, speed, heading, timestamp: new Date() };

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.id },
      {
        currentLocation: locationUpdate,
        $push: { locationHistory: { $each: [locationUpdate], $slice: -100 } },
        'iotSensorData.lastPing': new Date(),
        ...(occupancy !== undefined && { currentOccupancy: occupancy }),
        ...(sensorData && { iotSensorData: { ...sensorData, lastPing: new Date() } }),
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // Emit to socket
    req.app.get('io')?.emit('vehicle:location', {
      vehicleId: req.params.id,
      location: locationUpdate,
      status: vehicle.status,
      occupancy: vehicle.currentOccupancy
    });

    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/vehicles/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ vehicleId: req.params.id });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
