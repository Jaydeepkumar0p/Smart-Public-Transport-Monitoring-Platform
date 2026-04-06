const Vehicle = require('../models/Vehicle');

const connectedClients = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`📱 Client connected: ${socket.id}`);
    connectedClients.set(socket.id, { socket, rooms: [] });

    // Join specific route room
    socket.on('join:route', (routeId) => {
      socket.join(`route:${routeId}`);
      connectedClients.get(socket.id)?.rooms.push(`route:${routeId}`);
      console.log(`Client ${socket.id} joined route: ${routeId}`);
    });

    // Leave route room
    socket.on('leave:route', (routeId) => {
      socket.leave(`route:${routeId}`);
    });

    // Subscribe to vehicle updates
    socket.on('subscribe:vehicle', (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
    });

    // Subscribe to stop arrivals
    socket.on('subscribe:stop', (stopId) => {
      socket.join(`stop:${stopId}`);
    });

    // IoT sensor data update (from vehicle onboard system)
    socket.on('iot:update', async (data) => {
      try {
        const { vehicleId, lat, lng, speed, heading, occupancy, sensorData } = data;
        const locationUpdate = { lat, lng, speed, heading, timestamp: new Date() };

        const vehicle = await Vehicle.findOneAndUpdate(
          { vehicleId },
          {
            currentLocation: locationUpdate,
            $push: { locationHistory: { $each: [locationUpdate], $slice: -100 } },
            'iotSensorData.lastPing': new Date(),
            ...(occupancy !== undefined && { currentOccupancy: occupancy }),
            ...(sensorData && {
              'iotSensorData.engineStatus': sensorData.engineStatus,
              'iotSensorData.fuelLevel': sensorData.fuelLevel,
              'iotSensorData.doorStatus': sensorData.doorStatus,
              'iotSensorData.temperature': sensorData.temperature
            }),
            lastUpdated: new Date()
          },
          { new: true }
        ).populate('route', 'routeId name color');

        if (vehicle) {
          // Broadcast to all subscribers
          const payload = {
            vehicleId,
            location: locationUpdate,
            status: vehicle.status,
            occupancy: vehicle.currentOccupancy,
            route: vehicle.route,
            delay: vehicle.delayMinutes,
            sensorData: vehicle.iotSensorData
          };

          io.emit('vehicle:location', payload);
          io.to(`vehicle:${vehicleId}`).emit('vehicle:detail', payload);
          if (vehicle.route) {
            io.to(`route:${vehicle.route.routeId}`).emit('route:vehicle:update', payload);
          }
        }
      } catch (err) {
        console.error('IoT update error:', err.message);
      }
    });

    // Request current vehicle states
    socket.on('request:vehicles', async () => {
      try {
        const vehicles = await Vehicle.find({ status: 'active' })
          .select('vehicleId type status currentLocation route delayMinutes currentOccupancy capacity')
          .populate('route', 'routeId name color');
        socket.emit('vehicles:snapshot', vehicles);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Broadcast connected clients count every 30s
  setInterval(() => {
    io.emit('system:stats', {
      connectedClients: connectedClients.size,
      timestamp: new Date().toISOString()
    });
  }, 30000);
};

module.exports = { setupSocketHandlers, connectedClients };
