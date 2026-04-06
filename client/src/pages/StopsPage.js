import React, { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';

const AMENITY_ICONS = { shelter: '⛱', seating: '💺', realTimeDisplay: '📺', accessibility: '♿', wifi: '📶' };

export default function StopsPage() {
  const [stops, setStops] = useState([]);
  const [selected, setSelected] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    API.get('/stops').then(r => { setStops(r.data.stops); setLoading(false); });
  }, []);

  const selectStop = async (stop) => {
    setSelected(stop);
    try {
      const r = await API.get(`/stops/${stop.stopId}`);
      setArrivals(r.data.upcomingArrivals || []);
    } catch { setArrivals([]); }
  };

  const filtered = stops.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.stopId.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || s.type === filterType;
    return matchSearch && matchType;
  });

  const typeColors = { bus_stop: 'var(--accent-blue)', train_station: 'var(--accent-amber)', metro_station: 'var(--accent-purple)', interchange: 'var(--accent-cyan)' };

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div>
      <div className="filter-bar">
        <input className="form-input" placeholder="Search stops..." style={{ width: 240 }} value={search} onChange={e => setSearch(e.target.value)} />
        {['all', 'bus_stop', 'train_station', 'metro_station', 'interchange'].map(t => (
          <button key={t} className={`filter-chip ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
            {t === 'all' ? 'All' : t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} stops</span>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Stop List */}
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Stop</th>
                <th>Type</th>
                <th>Routes</th>
                <th>Amenities</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} onClick={() => selectStop(s)} style={{ cursor: 'pointer', background: selected?.stopId === s.stopId ? 'var(--bg-card-hover)' : '' }}>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: typeColors[s.type] }}>{s.stopId}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                    {s.location.landmark && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.location.landmark}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)' }}>
                      {s.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(s.routes || []).slice(0, 3).map(r => (
                        <span key={r._id} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: `${r.color}20`, color: r.color, fontFamily: 'var(--font-mono)', border: `1px solid ${r.color}40` }}>
                          {r.routeId}
                        </span>
                      ))}
                      {(s.routes || []).length > 3 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{s.routes.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Object.entries(s.amenities || {}).filter(([, v]) => v).map(([key]) => (
                        <span key={key} title={key} style={{ fontSize: 13 }}>{AMENITY_ICONS[key]}</span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`badge ${s.status === 'operational' ? 'badge-active' : 'badge-maintenance'}`}>{s.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No stops found</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Stop Detail */}
        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: typeColors[selected.type], marginBottom: 4 }}>{selected.stopId}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
                {selected.location.address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {selected.location.address}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lat</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{selected.location.lat.toFixed(5)}</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lng</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{selected.location.lng.toFixed(5)}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Amenities</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(selected.amenities || {}).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: val ? 'rgba(16,185,129,0.1)' : 'var(--bg-primary)', borderRadius: 20, border: `1px solid ${val ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, opacity: val ? 1 : 0.4 }}>
                      <span style={{ fontSize: 13 }}>{AMENITY_ICONS[key]}</span>
                      <span style={{ fontSize: 11, color: val ? 'var(--accent-green)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Upcoming Arrivals</div>
                {arrivals.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>No vehicles approaching</div>
                ) : arrivals.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 30, textAlign: 'center', fontSize: 18 }}>{a.vehicle.type === 'bus' ? '🚌' : '🚇'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{a.vehicle.id}</div>
                      {a.route && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.route.routeId} — {a.route.name}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: a.estimatedMinutes <= 2 ? 'var(--accent-green)' : a.estimatedMinutes <= 5 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                        {a.estimatedMinutes != null ? `${a.estimatedMinutes} min` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{Math.round((a.occupancy / a.capacity) * 100)}% full</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Select a Stop</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>View details and upcoming arrivals</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
