import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [vehicleLocations, setVehicleLocations] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', s.id);
      s.emit('request:vehicles');
    });

    s.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Socket disconnected:', reason);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnected(false);
    });

    s.on('vehicle:location', (data) => {
      setVehicleLocations(prev => ({
        ...prev,
        [data.vehicleId]: { ...prev[data.vehicleId], ...data, updatedAt: Date.now() }
      }));
    });

    s.on('vehicles:snapshot', (vehicles) => {
      const map = {};
      (vehicles || []).forEach(v => {
        map[v.vehicleId] = {
          vehicleId: v.vehicleId,
          location: v.currentLocation,
          status: v.status,
          route: v.route,
          occupancy: v.currentOccupancy,
          totalCapacity: (v.capacity?.seated || 0) + (v.capacity?.standing || 0),
          delay: v.delayMinutes || 0,
        };
      });
      setVehicleLocations(map);
    });

    s.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100));
    });

    s.on('alert:resolved', ({ id }) => {
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: false } : a));
    });

    s.on('system:stats', (stats) => {
      setSystemStats(stats);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, vehicleLocations, alerts, systemStats }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
