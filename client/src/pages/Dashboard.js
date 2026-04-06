import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value ?? '—'}</div>
    {sub && <div className="stat-sub">{sub}</div>}
    <div className="stat-icon">{icon}</div>
  </div>
);

const OccBar = ({ pct }) => {
  const cls = pct < 50 ? 'occ-low' : pct < 80 ? 'occ-mid' : 'occ-high';
  return (
    <div className="occ-bar" style={{ width: 80 }}>
      <div className={`occ-bar-fill ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { vehicleLocations, alerts: socketAlerts } = useSocket();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [s, v, a] = await Promise.all([
        API.get('/analytics/dashboard'),
        API.get('/vehicles', { params: { status: 'active', limit: 8 } }),
        API.get('/alerts',   { params: { active: 'true', limit: 5 } }),
      ]);
      setStats(s.data.stats);
      setVehicles(v.data.vehicles || []);
      setAlerts(a.data.alerts || []);
    } catch (err) {
      setError('Failed to load dashboard data. Is the server running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh stats every 30s
  useEffect(() => {
    const t = setInterval(() => {
      API.get('/analytics/dashboard')
        .then(r => setStats(r.data.stats))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading dashboard...</span></div>;

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{error}</div>
      <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); load(); }}>
        Retry
      </button>
    </div>
  );

  const liveCount = Object.keys(vehicleLocations).length;
  const onTimeRate = stats?.delays?.total > 0
    ? Math.round((stats.delays.onTimeCount / stats.delays.total) * 100)
    : 100;

  // Merge socket alerts with API alerts (deduplicated)
  const allAlerts = [
    ...socketAlerts.filter(sa => !alerts.find(a => a._id === sa._id)),
    ...alerts,
  ].slice(0, 5);

  return (
    <div>
      {/* ── Primary stats ── */}
      <div className="stat-grid">
        <StatCard label="Active Vehicles"  value={stats?.vehicles?.active}  sub={`${stats?.vehicles?.total || 0} total fleet`}   color="blue"  icon="🚌" />
        <StatCard label="Delayed"          value={stats?.vehicles?.delayed} sub="Behind schedule"                                 color="amber" icon="⏱" />
        <StatCard label="Avg Occupancy"    value={`${stats?.avgOccupancy ?? 0}%`} sub="Across active fleet"                      color="green" icon="👥" />
        <StatCard label="Active Alerts"    value={stats?.alerts}            sub="Require attention"                               color="red"   icon="⚡" />
      </div>

      {/* ── Secondary stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Routes',  value: stats?.routes?.active, sub: `of ${stats?.routes?.total || 0}`, color: 'var(--accent-blue)' },
          { label: 'Total Stops',    value: stats?.stops,          sub: 'Network coverage',                color: 'var(--accent-purple)' },
          { label: 'Live Tracking',  value: liveCount,             sub: 'Via WebSocket',                  color: 'var(--accent-cyan)' },
          { label: 'On-Time Rate',   value: `${onTimeRate}%`,      sub: 'Fleet punctuality',              color: 'var(--accent-green)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid-2">
        {/* Active fleet table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Active Fleet</div>
              <div className="card-subtitle">Real-time vehicle status</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vehicles')}>View All →</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Route</th>
                <th>Status</th>
                <th>Occupancy</th>
                <th>Delay</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No active vehicles</td></tr>
              ) : vehicles.map(v => {
                const live = vehicleLocations[v.vehicleId];
                const total = (v.capacity?.seated || 0) + (v.capacity?.standing || 0);
                const occ   = total > 0 ? Math.round(((live?.occupancy ?? v.currentOccupancy) / total) * 100) : 0;
                const status = live?.status || v.status;
                const delay  = live?.delay ?? v.delayMinutes ?? 0;
                return (
                  <tr key={v._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/vehicles')}>
                    <td className="primary">
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.vehicleId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{v.type}</div>
                    </td>
                    <td>
                      {v.route ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.route.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{v.route.routeId}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${status}`}>{status}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <OccBar pct={occ} />
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{occ}%</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: delay > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                      {delay > 0 ? `+${delay}m` : 'On time'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Alerts */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Active Alerts</div>
                <div className="card-subtitle">System notifications</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>View All →</button>
            </div>
            {allAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
                ✅ No active alerts
              </div>
            ) : allAlerts.map((a, i) => (
              <div key={a._id || i} className="alert-item">
                <div className={`alert-dot ${a.severity}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.message}</div>
                </div>
                <span className={`badge badge-${a.severity}`} style={{ flexShrink: 0 }}>{a.severity}</span>
              </div>
            ))}
          </div>

          {/* Fleet breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Fleet Breakdown</div>
            </div>
            {(stats?.typeDistribution || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 12 }}>No fleet data</div>
            ) : (stats?.typeDistribution || []).map(t => {
              const pct = t.count > 0 ? Math.round((t.active / t.count) * 100) : 0;
              return (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 28, fontSize: 16, textAlign: 'center' }}>
                    {t._id === 'bus' ? '🚌' : t._id === 'train' ? '🚆' : t._id === 'metro' ? '🚇' : '🚊'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{t._id}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.active}/{t.count}</span>
                    </div>
                    <div className="occ-bar">
                      <div className="occ-bar-fill occ-low" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
