const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/routes
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const routes = await Route.find(filter)
      .populate('stops.stop', 'name location stopId code type')
      .sort({ routeId: 1 });

    res.json({ success: true, count: routes.length, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/routes/:id
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.id.toUpperCase() })
      .populate('stops.stop');

    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const vehicles = await Vehicle.find({ route: route._id, status: { $in: ['active', 'delayed'] } })
      .select('vehicleId type status currentLocation delayMinutes currentOccupancy capacity');

    res.json({ success: true, route, activeVehicles: vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/routes
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ success: true, route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/routes/:id
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const route = await Route.findOneAndUpdate(
      { routeId: req.params.id.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/routes/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.findOneAndDelete({ routeId: req.params.id.toUpperCase() });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
