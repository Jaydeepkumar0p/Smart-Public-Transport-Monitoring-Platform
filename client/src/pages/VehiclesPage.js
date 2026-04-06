import React, { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';


const OccBar = ({ v }) => {
  const total = v.capacity.seated + (v.capacity.standing || 0);
  const pct = total > 0 ? Math.round((v.currentOccupancy / total) * 100) : 0;
  const cls = pct < 50 ? 'occ-low' : pct < 80 ? 'occ-mid' : 'occ-high';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="occ-bar" style={{ width: 64 }}>
        <div className={`occ-bar-fill ${cls}`} style={{ width: `${pct}%` }}/>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{pct}%</span>
    </div>
  );
};

const VehicleDetailPanel = ({ vehicle, onClose, vehicleLocations }) => {
  if (!vehicle) return null;
  const live = vehicleLocations[vehicle.vehicleId];
  const loc = live?.location || vehicle.currentLocation;
  const status = live?.status || vehicle.status;
  const delay = live?.delay ?? vehicle.delayMinutes ?? 0;
  const sensor = live?.sensorData || vehicle.iotSensorData || {};
  const totalCap = vehicle.capacity.seated + (vehicle.capacity.standing || 0);
  const occ = live ? Math.round(((live.occupancy || 0) / (live.totalCapacity || totalCap)) * 100)
    : Math.round((vehicle.currentOccupancy / totalCap) * 100);

  return (
    <div style={{ position: 'fixed', right: 24, top: 80, width: 320, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-lg)', padding: 20, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{vehicle.vehicleId}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{vehicle.registrationNumber}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <span className={`badge badge-${status}`}>{status}</span>
        <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' }}>{vehicle.type}</span>
        {delay > 0 && <span className="badge badge-delayed">+{delay}m delay</span>}
      </div>

      {vehicle.route && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: vehicle.route.color, flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.route.routeId}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vehicle.route.name}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Occupancy</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{vehicle.currentOccupancy} / {totalCap} passengers</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: occ > 80 ? 'var(--accent-red)' : occ > 50 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>{occ}%</span>
        </div>
        <div className="occ-bar" style={{ height: 6 }}>
          <div className={`occ-bar-fill ${occ < 50 ? 'occ-low' : occ < 80 ? 'occ-mid' : 'occ-high'}`} style={{ width: `${occ}%` }}/>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>IoT Sensor Data</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">Engine</div>
            <div className="sensor-value" style={{ color: sensor.engineStatus === 'on' ? 'var(--accent-green)' : 'var(--text-muted)', fontSize: 13 }}>{sensor.engineStatus || '—'}</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">Fuel</div>
            <div className="sensor-value" style={{ color: sensor.fuelLevel < 20 ? 'var(--accent-red)' : sensor.fuelLevel < 40 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{sensor.fuelLevel != null ? `${Math.round(sensor.fuelLevel)}%` : '—'}</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">Speed</div>
            <div className="sensor-value">{loc?.speed != null ? `${loc.speed} km/h` : '—'}</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">Temp</div>
            <div className="sensor-value" style={{ color: sensor.temperature > 90 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{sensor.temperature != null ? `${Math.round(sensor.temperature)}°C` : '—'}</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">Doors</div>
            <div className="sensor-value" style={{ fontSize: 12, color: sensor.doorStatus === 'open' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{sensor.doorStatus || '—'}</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">GPS Acc</div>
            <div className="sensor-value" style={{ fontSize: 13 }}>{sensor.gpsAccuracy != null ? `${sensor.gpsAccuracy.toFixed(1)}m` : '—'}</div>
          </div>
        </div>
      </div>

      {vehicle.driver?.name && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Driver</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{vehicle.driver.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vehicle.driver.contact}</div>
        </div>
      )}

      {loc && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Location</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
            {loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Heading: {loc.heading || 0}°</div>
        </div>
      )}
    </div>
  );
};

const STATUSES = ['all', 'active', 'delayed', 'idle', 'maintenance', 'offline'];
const TYPES = ['all', 'bus', 'train', 'metro', 'tram'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { vehicleLocations } = useSocket();


  const load = () => {
    setLoading(true);
    const params = {};
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterType !== 'all') params.type = filterType;
    API.get('/vehicles', { params: { ...params, limit: 100 } })
      .then(r => setVehicles(r.data.vehicles))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterType]);

  const filtered = vehicles.filter(v =>
    !search || v.vehicleId.toLowerCase().includes(search.toLowerCase()) ||
    v.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = vehicles.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {['active','delayed','idle','maintenance','offline'].map(s => (
          <div key={s} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', cursor: 'pointer', borderColor: filterStatus === s ? 'var(--accent-blue)' : 'var(--border)' }}
            onClick={() => setFilterStatus(s === filterStatus ? 'all' : s)}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{s}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <input className="form-input" placeholder="Search vehicle ID or reg number..." style={{ width: 260 }} value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TYPES.map(t => <button key={t} className={`filter-chip ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} vehicles</div>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Type</th>
                <th>Route</th>
                <th>Status</th>
                <th>Speed</th>
                <th>Occupancy</th>
                <th>Fuel</th>
                <th>Delay</th>
                <th>Last Ping</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const live = vehicleLocations[v.vehicleId];
                const status = live?.status || v.status;
                const delay = live?.delay ?? v.delayMinutes ?? 0;
                const sensor = live?.sensorData || v.iotSensorData || {};

                return (
                  <tr key={v._id} onClick={() => setSelected(selected?.vehicleId === v.vehicleId ? null : v)} style={{ cursor: 'pointer', background: selected?.vehicleId === v.vehicleId ? 'var(--bg-card-hover)' : '' }}>
                    <td className="primary">
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.vehicleId}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.registrationNumber}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{v.type === 'bus' ? '🚌 ' : v.type === 'train' ? '🚆 ' : '🚇 '}{v.type}</td>
                    <td>
                      {v.route ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.route.color }}/>
                          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{v.route.routeId}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${status}`}>{status}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{live?.location?.speed ?? v.currentLocation?.speed ?? 0} km/h</td>
                    <td><OccBar v={v}/></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="occ-bar" style={{ width: 40 }}>
                          <div className={`occ-bar-fill ${(sensor.fuelLevel || 50) < 20 ? 'occ-high' : (sensor.fuelLevel || 50) < 40 ? 'occ-mid' : 'occ-low'}`} style={{ width: `${sensor.fuelLevel || 50}%` }}/>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{sensor.fuelLevel != null ? `${Math.round(sensor.fuelLevel)}%` : '—'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: delay > 0 ? 'var(--accent-amber)' : 'var(--accent-green)', fontSize: 12 }}>
                      {delay > 0 ? `+${delay}m` : '0m'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {v.iotSensorData?.lastPing ? new Date(v.iotSensorData.lastPing).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No vehicles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <VehicleDetailPanel vehicle={selected} onClose={() => setSelected(null)} vehicleLocations={vehicleLocations} />
    </div>
  );
}
