import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppLayout from './components/Common/AppLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LiveMapPage from './pages/LiveMapPage';
import VehiclesPage from './pages/VehiclesPage';
import RoutesPage from './pages/RoutesPage';
import StopsPage from './pages/StopsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import './styles/global.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"/><span>Loading...</span></div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="map" element={<LiveMapPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="stops" element={<StopsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
