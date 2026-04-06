import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Fix Leaflet's broken default icon path in webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_EMOJI = { bus: '🚌', train: '🚆', metro: '🚇', tram: '🚊' };

const vehicleIcon = (type, status, delay) => {
  const bg = status === 'delayed' ? '#f59e0b' : status === 'active' ? '#10b981' : '#6b7280';
  const pulse = delay > 5 ? 'animation:vp 1.5s ease-in-out infinite;' : '';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:2px solid rgba(255,255,255,0.4);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 10px rgba(0,0,0,0.45);${pulse}">${TYPE_EMOJI[type] || '🚌'}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -22],
  });
};

const stopIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 6px rgba(59,130,246,0.7);"></div>`,
  iconSize: [10, 10], iconAnchor: [5, 5],
});

const CHANDIGARH = [30.7333, 76.7794];

export default function LiveMapPage() {
  const [vehicles, setVehicles]   = useState([]);
  const [routes,   setRoutes]     = useState([]);
  const [stops,    setStops]      = useState([]);
  const [selRoute, setSelRoute]   = useState('all');
  const [showStops,   setShowStops]   = useState(true);
  const [showRoutes,  setShowRoutes]  = useState(true);
  const [loadError,   setLoadError]   = useState(null);
  const { vehicleLocations, connected } = useSocket();

  useEffect(() => {
    Promise.all([
      API.get('/vehicles/live'),
      API.get('/routes'),
      API.get('/stops'),
    ]).then(([v, r, s]) => {
      setVehicles(v.data.vehicles || []);
      setRoutes(r.data.routes || []);
      setStops(s.data.stops || []);
    }).catch(err => {
      setLoadError('Could not load map data. Check server connection.');
      console.error(err);
    });
  }, []);

  // Merge live socket positions into vehicles list
  const mergedVehicles = vehicles.map(v => {
    const live = vehicleLocations[v.vehicleId];
    if (!live) return v;
    return {
      ...v,
      currentLocation: live.location || v.currentLocation,
      status: live.status || v.status,
      delayMinutes: live.delay ?? v.delayMinutes,
      currentOccupancy: live.occupancy ?? v.currentOccupancy,
    };
  });

  // Also add any vehicles seen live but not in initial load
  Object.values(vehicleLocations).forEach(live => {
    if (!mergedVehicles.find(v => v.vehicleId === live.vehicleId)) {
      mergedVehicles.push({
        vehicleId: live.vehicleId,
        type: 'bus',
        status: live.status,
        currentLocation: live.location,
        delayMinutes: live.delay || 0,
        currentOccupancy: live.occupancy || 0,
        route: live.route,
        capacity: { seated: 60, standing: 0 },
      });
    }
  });

  const filtered = selRoute === 'all'
    ? mergedVehicles
    : mergedVehicles.filter(v => v.route?.routeId === selRoute);

  const activeCount  = filtered.filter(v => v.status === 'active').length;
  const delayedCount = filtered.filter(v => v.status === 'delayed').length;

  if (loadError) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{loadError}</div>
    </div>
  );

  return (
    <div>
      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 200 }}
          value={selRoute}
          onChange={e => setSelRoute(e.target.value)}
        >
          <option value="all">All Routes ({mergedVehicles.length} vehicles)</option>
          {routes.map(r => (
            <option key={r.routeId} value={r.routeId}>{r.routeId} — {r.name}</option>
          ))}
        </select>

        <button
          className={`btn btn-sm ${showStops ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowStops(s => !s)}
        >
          📍 Stops
        </button>
        <button
          className={`btn btn-sm ${showRoutes ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowRoutes(s => !s)}
        >
          ⛓ Route Paths
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{activeCount}</span> active
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{delayedCount}</span> delayed
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', height: 'calc(100vh - 215px)', minHeight: 480 }}>
        <style>{`
          @keyframes vp { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
          .leaflet-popup-content-wrapper {
            background: #111827 !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            color: #f0f4ff !important;
            border-radius: 10px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          }
          .leaflet-popup-tip { background: #111827 !important; }
          .leaflet-popup-close-button { color: #8b9cc8 !important; top: 8px !important; right: 8px !important; }
          .leaflet-tile { filter: brightness(0.48) saturate(0.55) hue-rotate(190deg); }
          .leaflet-control-zoom a { background: #111827 !important; color: #8b9cc8 !important; border-color: rgba(255,255,255,0.1) !important; }
        `}</style>

        <MapContainer
          center={CHANDIGARH}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Route polylines */}
          {showRoutes && routes
            .filter(r => selRoute === 'all' || r.routeId === selRoute)
            .map(r => r.polyline?.length > 1 && (
              <Polyline
                key={r.routeId}
                positions={r.polyline.map(p => [p.lat, p.lng])}
                color={r.color || '#3b82f6'}
                weight={3}
                opacity={0.75}
                dashArray="6 4"
              />
            ))
          }

          {/* Stop markers */}
          {showStops && stops
            .filter(s => selRoute === 'all' || (s.routes || []).some(r => r.routeId === selRoute))
            .map(s => (
              <Marker key={s.stopId} position={[s.location.lat, s.location.lng]} icon={stopIcon()}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>📍 {s.name}</div>
                    {s.location.address && <div style={{ fontSize: 11, color: '#8b9cc8', marginBottom: 4 }}>{s.location.address}</div>}
                    <div style={{ fontSize: 11, marginBottom: 2 }}>
                      <b>Type:</b> {s.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <b>Routes:</b> {(s.routes || []).map(r => r.routeId).join(', ') || '—'}
                    </div>
                    {s.amenities?.realTimeDisplay && (
                      <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>✓ Real-time display</div>
                    )}
                    {s.amenities?.wifi && (
                      <div style={{ fontSize: 11, color: '#10b981' }}>✓ WiFi available</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))
          }

          {/* Vehicle markers */}
          {filtered.map(v => {
            const loc = v.currentLocation;
            if (!loc?.lat || !loc?.lng) return null;
            const total = (v.capacity?.seated || 0) + (v.capacity?.standing || 0);
            const occ   = total > 0 ? Math.round((v.currentOccupancy / total) * 100) : 0;
            return (
              <Marker
                key={v.vehicleId}
                position={[loc.lat, loc.lng]}
                icon={vehicleIcon(v.type, v.status, v.delayMinutes || 0)}
              >
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: 190 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                      {TYPE_EMOJI[v.type] || '🚌'} {v.vehicleId}
                    </div>
                    {v.route && (
                      <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.route.color, flexShrink: 0 }} />
                        <b>Route:</b> {v.route.routeId} — {v.route.name}
                      </div>
                    )}
                    <div style={{ fontSize: 12, marginBottom: 3 }}>
                      <b>Status:</b>{' '}
                      <span style={{ color: v.status === 'delayed' ? '#f59e0b' : '#10b981', fontWeight: 600, textTransform: 'capitalize' }}>
                        {v.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 3 }}><b>Occupancy:</b> {occ}%</div>
                    <div style={{ fontSize: 12, marginBottom: 3 }}><b>Speed:</b> {loc.speed || 0} km/h</div>
                    {(v.delayMinutes || 0) > 0 && (
                      <div style={{ fontSize: 12, color: '#f59e0b' }}><b>Delay:</b> +{v.delayMinutes} min</div>
                    )}
                    <div style={{ fontSize: 10, color: '#8b9cc8', marginTop: 6 }}>
                      {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#10b981', label: 'Active' },
          { color: '#f59e0b', label: 'Delayed' },
          { color: '#6b7280', label: 'Idle' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 18, height: 3, background: 'var(--accent-blue)', borderRadius: 1 }} />
          Route path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)' }} />
          Stop
        </div>
      </div>
    </div>
  );
}
