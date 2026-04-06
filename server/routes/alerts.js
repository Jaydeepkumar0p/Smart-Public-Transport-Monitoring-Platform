const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { active, type, severity, limit = 20 } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const alerts = await Alert.find(filter)
      .populate('vehicle', 'vehicleId type')
      .populate('route', 'routeId name color')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const alert = await Alert.create({ ...req.body, createdBy: req.user._id });
    req.app.get('io')?.emit('alert:new', alert);
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id/resolve', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isActive: false, resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );
    req.app.get('io')?.emit('alert:resolved', { id: req.params.id });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
