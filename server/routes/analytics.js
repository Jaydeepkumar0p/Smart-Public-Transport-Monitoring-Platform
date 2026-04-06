const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

// @GET /api/analytics/dashboard - System overview
router.get('/dashboard', protect, async (req, res) => {
  try {
    const [
      totalVehicles, activeVehicles, delayedVehicles,
      totalRoutes, activeRoutes,
      totalStops, activeAlerts
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'active' }),
      Vehicle.countDocuments({ status: 'delayed' }),
      Route.countDocuments(),
      Route.countDocuments({ status: 'active' }),
      Stop.countDocuments(),
      Alert.countDocuments({ isActive: true })
    ]);

    // Calculate average occupancy
    const occupancyData = await Vehicle.aggregate([
      { $match: { status: 'active' } },
      { $project: {
        occupancyPercent: {
          $multiply: [
            { $divide: ['$currentOccupancy', { $add: ['$capacity.seated', '$capacity.standing'] }] },
            100
          ]
        }
      }},
      { $group: { _id: null, avgOccupancy: { $avg: '$occupancyPercent' } }}
    ]);

    // Get vehicle type distribution
    const typeDistribution = await Vehicle.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } }}
    ]);

    // Delay statistics
    const delayStats = await Vehicle.aggregate([
      { $match: { status: { $in: ['active', 'delayed'] } } },
      { $group: {
        _id: null,
        avgDelay: { $avg: '$delayMinutes' },
        maxDelay: { $max: '$delayMinutes' },
        onTimeCount: { $sum: { $cond: [{ $lte: ['$delayMinutes', 2] }, 1, 0] } },
        total: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      stats: {
        vehicles: { total: totalVehicles, active: activeVehicles, delayed: delayedVehicles, idle: totalVehicles - activeVehicles - delayedVehicles },
        routes: { total: totalRoutes, active: activeRoutes },
        stops: totalStops,
        alerts: activeAlerts,
        avgOccupancy: Math.round(occupancyData[0]?.avgOccupancy || 0),
        typeDistribution,
        delays: delayStats[0] || { avgDelay: 0, maxDelay: 0, onTimeCount: 0, total: 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/analytics/routes - Route performance
router.get('/routes', protect, async (req, res) => {
  try {
    const routeStats = await Vehicle.aggregate([
      { $match: { route: { $exists: true } } },
      { $group: {
        _id: '$route',
        vehicleCount: { $sum: 1 },
        activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        avgDelay: { $avg: '$delayMinutes' },
        avgOccupancy: { $avg: { $multiply: [
          { $divide: ['$currentOccupancy', { $add: ['$capacity.seated', '$capacity.standing'] }] }, 100
        ]}}
      }},
      { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'routeInfo' }},
      { $unwind: '$routeInfo' },
      { $project: {
        routeId: '$routeInfo.routeId',
        name: '$routeInfo.name',
        type: '$routeInfo.type',
        color: '$routeInfo.color',
        vehicleCount: 1, activeCount: 1,
        avgDelay: { $round: ['$avgDelay', 1] },
        avgOccupancy: { $round: ['$avgOccupancy', 1] }
      }},
      { $sort: { avgDelay: -1 } }
    ]);

    res.json({ success: true, routes: routeStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/analytics/hourly - Hourly traffic patterns (simulated)
router.get('/hourly', protect, async (req, res) => {
  try {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const isPeak = (i >= 8 && i <= 10) || (i >= 17 && i <= 20);
      const isNight = i >= 23 || i <= 5;
      return {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        passengers: isNight ? Math.floor(Math.random() * 50) :
                   isPeak ? Math.floor(600 + Math.random() * 400) :
                   Math.floor(200 + Math.random() * 200),
        avgDelay: isPeak ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 3),
        activeVehicles: isNight ? Math.floor(Math.random() * 5) :
                        isPeak ? Math.floor(40 + Math.random() * 20) :
                        Math.floor(20 + Math.random() * 15)
      };
    });

    res.json({ success: true, hourlyData: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/analytics/occupancy - Occupancy trends
router.get('/occupancy', protect, async (req, res) => {
  try {
    const occupancyByType = await Vehicle.aggregate([
      { $match: { status: 'active' } },
      { $group: {
        _id: '$type',
        avgOccupancy: { $avg: { $multiply: [
          { $divide: ['$currentOccupancy', { $add: ['$capacity.seated', '$capacity.standing'] }] }, 100
        ]}},
        count: { $sum: 1 }
      }},
      { $project: { type: '$_id', avgOccupancy: { $round: ['$avgOccupancy', 1] }, count: 1 }}
    ]);

    res.json({ success: true, occupancyByType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
