const Vehicle = require('../models/Vehicle');
const Alert   = require('../models/Alert');

// Chandigarh bounding box
const BOUNDS = { minLat: 30.68, maxLat: 30.80, minLng: 76.72, maxLng: 76.85 };
const BASE    = { lat: 30.7333, lng: 76.7794 };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function nextPosition(lat, lng, heading, speedKmh) {
  const distKm   = (speedKmh / 3600) * 3;          // 3-second tick
  const dLat     = (distKm / 111) * Math.cos(heading * Math.PI / 180);
  const dLng     = (distKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(heading * Math.PI / 180);
  let newLat = lat + dLat + (Math.random() - 0.5) * 0.0002;
  let newLng = lng + dLng + (Math.random() - 0.5) * 0.0002;

  // Bounce heading at boundaries
  let newHeading = heading + (Math.random() - 0.5) * 25;
  if (newLat < BOUNDS.minLat || newLat > BOUNDS.maxLat) newHeading = (newHeading + 180) % 360;
  if (newLng < BOUNDS.minLng || newLng > BOUNDS.maxLng) newHeading = (newHeading + 180) % 360;

  return {
    lat:     clamp(newLat, BOUNDS.minLat, BOUNDS.maxLat),
    lng:     clamp(newLng, BOUNDS.minLng, BOUNDS.maxLng),
    heading: ((newHeading % 360) + 360) % 360,
  };
}

async function tick(io) {
  let vehicles;
  try {
    vehicles = await Vehicle.find({ status: { $in: ['active', 'delayed'] } })
      .select('vehicleId type currentLocation iotSensorData capacity currentOccupancy delayMinutes route status')
      .lean();
  } catch {
    return; // DB not ready yet
  }

  if (!vehicles.length) return;

  const bulk = [];

  for (const v of vehicles) {
    const curr    = v.currentLocation || { lat: BASE.lat, lng: BASE.lng, heading: Math.random() * 360 };
    const speedKmh = 20 + Math.random() * 30;
    const { lat, lng, heading } = nextPosition(curr.lat, curr.lng, curr.heading || 0, speedKmh);
    const ts = new Date();

    const totalCap   = (v.capacity?.seated || 40) + (v.capacity?.standing || 20);
    const occDelta   = Math.floor((Math.random() - 0.48) * 6);
    const newOcc     = clamp((v.currentOccupancy || 0) + occDelta, 0, totalCap);
    const delayDelta = Math.random() > 0.75 ? 1 : Math.random() > 0.92 ? -1 : 0;
    const newDelay   = Math.max(0, (v.delayMinutes || 0) + delayDelta);
    const newStatus  = newDelay > 5 ? 'delayed' : 'active';
    const fuelLevel  = clamp((v.iotSensorData?.fuelLevel ?? 80) - 0.015, 0, 100);

    const locationData = { lat, lng, speed: Math.round(speedKmh), heading: Math.round(heading), timestamp: ts };
    const sensorData   = {
      engineStatus: 'on',
      fuelLevel:    Math.round(fuelLevel * 10) / 10,
      temperature:  Math.round((70 + Math.random() * 25) * 10) / 10,
      doorStatus:   Math.random() > 0.96 ? 'open' : 'closed',
      gpsAccuracy:  Math.round((2 + Math.random() * 4) * 10) / 10,
      lastPing:     ts,
    };

    bulk.push({
      updateOne: {
        filter: { _id: v._id },
        update: {
          $set: {
            currentLocation: locationData,
            currentOccupancy: newOcc,
            delayMinutes: newDelay,
            status: newStatus,
            iotSensorData: sensorData,
            lastUpdated: ts,
          },
          $push: {
            locationHistory: { $each: [locationData], $slice: -60 },
          },
        },
      },
    });

    // Emit to all clients
    io.emit('vehicle:location', {
      vehicleId:     v.vehicleId,
      location:      locationData,
      status:        newStatus,
      occupancy:     newOcc,
      totalCapacity: totalCap,
      delay:         newDelay,
      sensorData,
    });

    // Random alert (very rare)
    if (Math.random() > 0.9985) {
      const types = ['delay', 'overcrowding', 'breakdown'];
      const type  = types[Math.floor(Math.random() * types.length)];
      try {
        const alert = await Alert.create({
          type,
          severity: type === 'breakdown' ? 'high' : 'medium',
          title: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} — ${v.vehicleId}`,
          message: `Vehicle ${v.vehicleId} has reported a ${type.replace('_', ' ')} incident.`,
          vehicle: v._id,
          route:   v.route,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
        io.emit('alert:new', alert);
      } catch { /* ignore */ }
    }
  }

  if (bulk.length) {
    try {
      await Vehicle.bulkWrite(bulk, { ordered: false });
    } catch { /* ignore write errors */ }
  }
}

function startIoTSimulator(io) {
  console.log('🤖 IoT Simulator starting...');
  // Small delay to let DB settle
  setTimeout(() => {
    setInterval(() => tick(io).catch(() => {}), 3000);
    console.log('✅ IoT Simulator running (3s interval)');
  }, 3000);
}

module.exports = { startIoTSimulator };
