const express = require('express');
const router = express.Router();
const Stop = require('../models/Stop');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/stops
router.get('/', async (req, res) => {
  try {
    const { type, status, lat, lng, radius } = req.query;
    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    let stops = await Stop.find(filter).populate('routes', 'routeId name color type');

    // Filter by proximity if lat/lng provided
    if (lat && lng && radius) {
      const R = 6371; // Earth's radius in km
      const r = parseFloat(radius);
      stops = stops.filter(stop => {
        const dLat = (stop.location.lat - parseFloat(lat)) * Math.PI / 180;
        const dLon = (stop.location.lng - parseFloat(lng)) * Math.PI / 180;
        const a = Math.sin(dLat/2) ** 2 + Math.cos(parseFloat(lat) * Math.PI / 180) *
          Math.cos(stop.location.lat * Math.PI / 180) * Math.sin(dLon/2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return distance <= r;
      });
    }

    res.json({ success: true, count: stops.length, stops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/stops/:id - with upcoming arrivals
router.get('/:id', async (req, res) => {
  try {
    const stop = await Stop.findOne({ stopId: req.params.id.toUpperCase() })
      .populate('routes', 'routeId name color type frequency');

    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });

    // Find vehicles heading to this stop
    const vehicles = await Vehicle.find({
      'arrivalPredictions.stopId': stop._id,
      status: { $in: ['active', 'delayed'] }
    })
    .select('vehicleId type status currentOccupancy capacity delayMinutes arrivalPredictions route')
    .populate('route', 'routeId name color');

    const arrivals = vehicles.map(v => {
      const prediction = v.arrivalPredictions.find(p => p.stopId?.toString() === stop._id.toString());
      return {
        vehicle: { id: v.vehicleId, type: v.type, status: v.status },
        route: v.route,
        predictedArrival: prediction?.predictedArrival,
        estimatedMinutes: prediction?.estimatedMinutes,
        occupancy: v.currentOccupancy,
        capacity: v.capacity.seated + v.capacity.standing,
        delay: v.delayMinutes
      };
    }).sort((a, b) => (a.estimatedMinutes || 999) - (b.estimatedMinutes || 999));

    res.json({ success: true, stop, upcomingArrivals: arrivals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/stops
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const stop = await Stop.create(req.body);
    res.status(201).json({ success: true, stop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/stops/:id
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const stop = await Stop.findOneAndUpdate(
      { stopId: req.params.id.toUpperCase() },
      req.body,
      { new: true }
    );
    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
    res.json({ success: true, stop });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
