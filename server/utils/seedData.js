require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const User = require('../models/User');
const Alert = require('../models/Alert');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_transport';

const stops = [
  { stopId: 'S001', name: 'Sector 17 Bus Stand', code: 'S17', type: 'bus_stop', location: { lat: 30.7413, lng: 76.7784, address: 'Sector 17, Chandigarh', landmark: 'Near Plaza' }, amenities: { shelter: true, seating: true, realTimeDisplay: true, accessibility: true, wifi: true } },
  { stopId: 'S002', name: 'ISBT Sector 43', code: 'ISBT', type: 'bus_stop', location: { lat: 30.7098, lng: 76.7967, address: 'Sector 43, Chandigarh', landmark: 'Main Bus Terminal' }, amenities: { shelter: true, seating: true, realTimeDisplay: true, accessibility: true, wifi: true } },
  { stopId: 'S003', name: 'PGI Hospital', code: 'PGI', type: 'bus_stop', location: { lat: 30.7651, lng: 76.7773, address: 'Sector 12, Chandigarh', landmark: 'Near PGI Main Gate' }, amenities: { shelter: true, seating: true, realTimeDisplay: false, accessibility: true } },
  { stopId: 'S004', name: 'Sector 22 Chowk', code: 'S22', type: 'bus_stop', location: { lat: 30.7358, lng: 76.7986, address: 'Sector 22, Chandigarh' }, amenities: { shelter: true, seating: false, realTimeDisplay: false } },
  { stopId: 'S005', name: 'Panjab University', code: 'PU', type: 'bus_stop', location: { lat: 30.7601, lng: 76.7657, address: 'Sector 14, Chandigarh', landmark: 'University Main Gate' }, amenities: { shelter: true, seating: true, realTimeDisplay: true } },
  { stopId: 'S006', name: 'Rock Garden', code: 'RG', type: 'bus_stop', location: { lat: 30.7526, lng: 76.8082, address: 'Sector 1, Chandigarh', landmark: 'Near Rock Garden' }, amenities: { shelter: false, seating: false } },
  { stopId: 'S007', name: 'Sector 35 Bus Stop', code: 'S35', type: 'bus_stop', location: { lat: 30.7241, lng: 76.7690, address: 'Sector 35, Chandigarh' }, amenities: { shelter: true, seating: true } },
  { stopId: 'S008', name: 'Tribune Chowk', code: 'TC', type: 'bus_stop', location: { lat: 30.6982, lng: 76.7601, address: 'Sector 29, Chandigarh', landmark: 'Tribune Office' }, amenities: { shelter: true, seating: false } },
  { stopId: 'S009', name: 'Elante Mall', code: 'EL', type: 'bus_stop', location: { lat: 30.7038, lng: 76.8010, address: 'Industrial Area Phase 1', landmark: 'Near Elante Mall' }, amenities: { shelter: true, seating: true, realTimeDisplay: true } },
  { stopId: 'S010', name: 'Chandigarh Railway Station', code: 'CRS', type: 'train_station', location: { lat: 30.6942, lng: 76.7730, address: 'Sector 17, Chandigarh', landmark: 'Main Railway Station' }, amenities: { shelter: true, seating: true, realTimeDisplay: true, accessibility: true, wifi: true } },
];

const seedRoutes = (stopDocs) => [
  {
    routeId: 'R001', name: 'ISBT - Sector 17 - PGI', type: 'bus', color: '#3B82F6',
    description: 'Main city corridor connecting ISBT to PGI Hospital via Sector 17',
    stops: [
      { stop: stopDocs['S002']._id, sequence: 1, distanceFromPrev: 0, estimatedTravelTime: 0 },
      { stop: stopDocs['S004']._id, sequence: 2, distanceFromPrev: 3.2, estimatedTravelTime: 10 },
      { stop: stopDocs['S001']._id, sequence: 3, distanceFromPrev: 2.1, estimatedTravelTime: 7 },
      { stop: stopDocs['S005']._id, sequence: 4, distanceFromPrev: 4.3, estimatedTravelTime: 14 },
      { stop: stopDocs['S003']._id, sequence: 5, distanceFromPrev: 2.8, estimatedTravelTime: 9 },
    ],
    totalDistance: 12.4, estimatedDuration: 40, frequency: 15,
    fare: { base: 10, perKm: 1.5, currency: 'INR' },
    polyline: [
      { lat: 30.7098, lng: 76.7967 }, { lat: 30.7150, lng: 76.7960 },
      { lat: 30.7250, lng: 76.7980 }, { lat: 30.7358, lng: 76.7986 },
      { lat: 30.7380, lng: 76.7900 }, { lat: 30.7413, lng: 76.7784 },
      { lat: 30.7500, lng: 76.7750 }, { lat: 30.7601, lng: 76.7657 },
      { lat: 30.7620, lng: 76.7700 }, { lat: 30.7651, lng: 76.7773 }
    ],
    status: 'active'
  },
  {
    routeId: 'R002', name: 'Railway Station - Elante - ISBT', type: 'bus', color: '#10B981',
    description: 'South corridor via shopping district',
    stops: [
      { stop: stopDocs['S010']._id, sequence: 1, distanceFromPrev: 0, estimatedTravelTime: 0 },
      { stop: stopDocs['S008']._id, sequence: 2, distanceFromPrev: 2.5, estimatedTravelTime: 8 },
      { stop: stopDocs['S009']._id, sequence: 3, distanceFromPrev: 4.1, estimatedTravelTime: 13 },
      { stop: stopDocs['S007']._id, sequence: 4, distanceFromPrev: 3.8, estimatedTravelTime: 12 },
      { stop: stopDocs['S002']._id, sequence: 5, distanceFromPrev: 5.2, estimatedTravelTime: 17 },
    ],
    totalDistance: 15.6, estimatedDuration: 50, frequency: 20,
    fare: { base: 10, perKm: 1.5, currency: 'INR' },
    polyline: [
      { lat: 30.6942, lng: 76.7730 }, { lat: 30.6960, lng: 76.7680 },
      { lat: 30.6982, lng: 76.7601 }, { lat: 30.7000, lng: 76.7750 },
      { lat: 30.7038, lng: 76.8010 }, { lat: 30.7100, lng: 76.7800 },
      { lat: 30.7200, lng: 76.7700 }, { lat: 30.7241, lng: 76.7690 },
      { lat: 30.7150, lng: 76.7980 }, { lat: 30.7098, lng: 76.7967 }
    ],
    status: 'active'
  },
  {
    routeId: 'R003', name: 'Rock Garden - Sector 17 Express', type: 'bus', color: '#F59E0B',
    description: 'Tourist express route',
    stops: [
      { stop: stopDocs['S006']._id, sequence: 1, distanceFromPrev: 0, estimatedTravelTime: 0 },
      { stop: stopDocs['S001']._id, sequence: 2, distanceFromPrev: 5.5, estimatedTravelTime: 18 },
      { stop: stopDocs['S004']._id, sequence: 3, distanceFromPrev: 2.1, estimatedTravelTime: 7 },
    ],
    totalDistance: 7.6, estimatedDuration: 25, frequency: 30,
    fare: { base: 15, perKm: 2.0, currency: 'INR' },
    polyline: [
      { lat: 30.7526, lng: 76.8082 }, { lat: 30.7490, lng: 76.8000 },
      { lat: 30.7450, lng: 76.7900 }, { lat: 30.7413, lng: 76.7784 },
      { lat: 30.7380, lng: 76.7900 }, { lat: 30.7358, lng: 76.7986 }
    ],
    status: 'active'
  },
];

const seedVehicles = (routeDocs) => [
  { vehicleId: 'BUS001', type: 'bus', registrationNumber: 'CH01-PA-1001', capacity: { seated: 40, standing: 20 }, currentOccupancy: 28, status: 'active', route: routeDocs['R001']._id, currentLocation: { lat: 30.7250, lng: 76.7980, speed: 32, heading: 45 }, driver: { name: 'Rajesh Kumar', id: 'D001', contact: '9876543210' }, iotSensorData: { engineStatus: 'on', fuelLevel: 72, temperature: 78, doorStatus: 'closed', gpsAccuracy: 3.2, lastPing: new Date() }, delayMinutes: 2 },
  { vehicleId: 'BUS002', type: 'bus', registrationNumber: 'CH01-PA-1002', capacity: { seated: 40, standing: 20 }, currentOccupancy: 55, status: 'delayed', route: routeDocs['R001']._id, currentLocation: { lat: 30.7500, lng: 76.7750, speed: 18, heading: 180 }, driver: { name: 'Suresh Singh', id: 'D002', contact: '9876543211' }, iotSensorData: { engineStatus: 'on', fuelLevel: 45, temperature: 82, doorStatus: 'closed', gpsAccuracy: 4.1, lastPing: new Date() }, delayMinutes: 8 },
  { vehicleId: 'BUS003', type: 'bus', registrationNumber: 'CH01-PA-1003', capacity: { seated: 40, standing: 20 }, currentOccupancy: 15, status: 'active', route: routeDocs['R002']._id, currentLocation: { lat: 30.7000, lng: 76.7750, speed: 40, heading: 90 }, driver: { name: 'Amit Sharma', id: 'D003', contact: '9876543212' }, iotSensorData: { engineStatus: 'on', fuelLevel: 89, temperature: 75, doorStatus: 'closed', gpsAccuracy: 2.8, lastPing: new Date() }, delayMinutes: 0 },
  { vehicleId: 'BUS004', type: 'bus', registrationNumber: 'CH01-PA-1004', capacity: { seated: 40, standing: 20 }, currentOccupancy: 38, status: 'active', route: routeDocs['R002']._id, currentLocation: { lat: 30.7200, lng: 76.7700, speed: 35, heading: 270 }, driver: { name: 'Vikram Patel', id: 'D004', contact: '9876543213' }, iotSensorData: { engineStatus: 'on', fuelLevel: 61, temperature: 77, doorStatus: 'closed', gpsAccuracy: 3.5, lastPing: new Date() }, delayMinutes: 3 },
  { vehicleId: 'BUS005', type: 'bus', registrationNumber: 'CH01-PA-1005', capacity: { seated: 40, standing: 20 }, currentOccupancy: 22, status: 'active', route: routeDocs['R003']._id, currentLocation: { lat: 30.7450, lng: 76.7950, speed: 28, heading: 135 }, driver: { name: 'Naveen Gupta', id: 'D005', contact: '9876543214' }, iotSensorData: { engineStatus: 'on', fuelLevel: 54, temperature: 79, doorStatus: 'closed', gpsAccuracy: 3.0, lastPing: new Date() }, delayMinutes: 1 },
  { vehicleId: 'BUS006', type: 'bus', registrationNumber: 'CH01-PA-1006', capacity: { seated: 40, standing: 20 }, currentOccupancy: 0, status: 'idle', currentLocation: { lat: 30.7098, lng: 76.7967, speed: 0, heading: 0 }, driver: { name: 'Prem Chand', id: 'D006', contact: '9876543215' }, iotSensorData: { engineStatus: 'off', fuelLevel: 95, temperature: 30, doorStatus: 'closed', gpsAccuracy: 5.0, lastPing: new Date() }, delayMinutes: 0 },
  { vehicleId: 'BUS007', type: 'bus', registrationNumber: 'CH01-PA-1007', capacity: { seated: 50, standing: 30 }, currentOccupancy: 44, status: 'active', route: routeDocs['R001']._id, currentLocation: { lat: 30.7380, lng: 76.7900, speed: 30, heading: 200 }, driver: { name: 'Harpal Singh', id: 'D007', contact: '9876543216' }, iotSensorData: { engineStatus: 'on', fuelLevel: 33, temperature: 85, doorStatus: 'closed', gpsAccuracy: 3.8, lastPing: new Date() }, delayMinutes: 5 },
  { vehicleId: 'BUS008', type: 'bus', registrationNumber: 'CH01-PA-1008', capacity: { seated: 40, standing: 20 }, currentOccupancy: 0, status: 'maintenance', currentLocation: { lat: 30.7150, lng: 76.7800, speed: 0, heading: 0 }, iotSensorData: { engineStatus: 'off', fuelLevel: 20, temperature: 28, doorStatus: 'open', gpsAccuracy: 6.0, lastPing: new Date() }, delayMinutes: 0 },
  { vehicleId: 'TRAIN001', type: 'train', registrationNumber: 'IR-CDG-12301', capacity: { seated: 200, standing: 100 }, currentOccupancy: 145, status: 'active', currentLocation: { lat: 30.6942, lng: 76.7730, speed: 60, heading: 0 }, driver: { name: 'Loco Pilot - Mahesh', id: 'LP001', contact: '9876543217' }, iotSensorData: { engineStatus: 'on', fuelLevel: 70, temperature: 65, doorStatus: 'closed', gpsAccuracy: 1.5, lastPing: new Date() }, delayMinutes: 0 },
  { vehicleId: 'METRO001', type: 'metro', registrationNumber: 'CHD-MET-001', capacity: { seated: 100, standing: 200 }, currentOccupancy: 180, status: 'active', currentLocation: { lat: 30.7300, lng: 76.7850, speed: 70, heading: 90 }, iotSensorData: { engineStatus: 'on', fuelLevel: 100, temperature: 55, doorStatus: 'closed', gpsAccuracy: 1.0, lastPing: new Date() }, delayMinutes: 0 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Vehicle.deleteMany({}), Route.deleteMany({}),
      Stop.deleteMany({}), User.deleteMany({}), Alert.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Seed stops
    const createdStops = await Stop.insertMany(stops);
    const stopMap = {};
    createdStops.forEach(s => { stopMap[s.stopId] = s; });
    console.log(`✅ Created ${createdStops.length} stops`);

    // Seed routes
    const routeData = seedRoutes(stopMap);
    const createdRoutes = await Route.insertMany(routeData);
    const routeMap = {};
    createdRoutes.forEach(r => { routeMap[r.routeId] = r; });
    console.log(`✅ Created ${createdRoutes.length} routes`);

    // Update stops with route references
    for (const route of createdRoutes) {
      const stopIds = route.stops.map(s => s.stop);
      await Stop.updateMany({ _id: { $in: stopIds } }, { $addToSet: { routes: route._id } });
    }

    // Seed vehicles
    const vehicleData = seedVehicles(routeMap);
    const createdVehicles = await Vehicle.insertMany(vehicleData);
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    // Seed users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@transport.gov.in', password: 'admin123', role: 'admin' },
      { name: 'Operator One', email: 'operator@transport.gov.in', password: 'operator123', role: 'operator' },
      { name: 'Viewer User', email: 'viewer@transport.gov.in', password: 'viewer123', role: 'viewer' },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Seed alerts
    await Alert.create([
      { type: 'delay', severity: 'high', title: 'Route R001 Delays', message: 'Heavy traffic near Sector 22 causing 8-minute delays on Route R001', route: routeMap['R001']._id, vehicle: createdVehicles.find(v => v.vehicleId === 'BUS002')._id, isActive: true },
      { type: 'info', severity: 'low', title: 'Route R002 Update', message: 'Route R002 operating normally. Additional buses deployed during peak hours.', route: routeMap['R002']._id, isActive: true },
    ]);
    console.log('✅ Created alerts');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:    admin@transport.gov.in    / admin123');
    console.log('  Operator: operator@transport.gov.in / operator123');
    console.log('  Viewer:   viewer@transport.gov.in   / viewer123\n');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
