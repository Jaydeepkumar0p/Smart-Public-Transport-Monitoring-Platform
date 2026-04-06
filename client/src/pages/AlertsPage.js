import React, { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'delay', severity: 'medium', title: '', message: '' });
  const { alerts: socketAlerts } = useSocket();
  const { user } = useAuth();

  const loadAlerts = () => {
    const params = {};
    if (filter === 'active') params.active = true;
    if (filter === 'resolved') params.active = false;
    if (typeFilter !== 'all') params.type = typeFilter;
    API.get('/alerts', { params: { ...params, limit: 50 } })
      .then(r => setAlerts(r.data.alerts))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAlerts(); }, [filter, typeFilter]);

  // Merge live socket alerts
  useEffect(() => {
    if (socketAlerts.length > 0 && filter === 'active') {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a._id));
        const newOnes = socketAlerts.filter(a => !existingIds.has(a._id));
        return [...newOnes, ...prev].slice(0, 50);
      });
    }
  }, [socketAlerts]);

  const resolveAlert = async (id) => {
    try {
      await API.put(`/alerts/${id}/resolve`);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch (e) { console.error(e); }
  };

  const createAlert = async () => {
    if (!form.title || !form.message) return;
    try {
      const r = await API.post('/alerts', form);
      setAlerts(prev => [r.data.alert, ...prev]);
      setShowCreate(false);
      setForm({ type: 'delay', severity: 'medium', title: '', message: '' });
    } catch (e) { console.error(e); }
  };

  const sorted = [...alerts].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  const counts = alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {});

  const TYPE_ICONS = { delay: '⏱', breakdown: '🔧', route_change: '🔄', overcrowding: '👥', emergency: '🚨', info: 'ℹ️' };
  const SEVERITY_COLORS = { critical: 'var(--accent-red)', high: 'var(--accent-red)', medium: 'var(--accent-amber)', low: 'var(--accent-green)' };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {['critical','high','medium','low'].map(s => (
          <div key={s} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{s}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: SEVERITY_COLORS[s] }}>{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="filter-bar">
        {['active','resolved','all'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }}/>
        {['all','delay','breakdown','route_change','overcrowding','emergency','info'].map(t => (
          <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)} style={{ textTransform: 'capitalize', fontSize: 11 }}>
            {t === 'all' ? 'All Types' : t.replace('_', ' ')}
          </button>
        ))}
        {(user?.role === 'admin' || user?.role === 'operator') && (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(s => !s)}>
            + New Alert
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Create Alert</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['delay','breakdown','route_change','overcrowding','emergency','info'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Severity</label>
              <select className="form-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="Alert title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Message</label>
            <input className="form-input" placeholder="Describe the alert..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={createAlert}>Publish Alert</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Alert List */}
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div>
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 14 }}>No alerts found</div>
            </div>
          )}
          {sorted.map((a, i) => (
            <div key={a._id || i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICONS[a.type] || '⚠️'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</span>
                  <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: 'var(--bg-primary)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{a.type?.replace('_', ' ')}</span>
                  {a.vehicle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🚌 {a.vehicle.vehicleId}</span>}
                  {a.route && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Route {a.route.routeId}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(a.createdAt).toLocaleString()}
                  {a.resolvedAt && ` · Resolved: ${new Date(a.resolvedAt).toLocaleString()}`}
                </div>
              </div>
              {a.isActive !== false && (user?.role === 'admin' || user?.role === 'operator') && (
                <button className="btn btn-ghost btn-sm" onClick={() => resolveAlert(a._id)} style={{ flexShrink: 0 }}>
                  ✓ Resolve
                </button>
              )}
              {a.isActive === false && (
                <span style={{ fontSize: 11, color: 'var(--accent-green)', padding: '4px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, flexShrink: 0 }}>Resolved</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
