import React, { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get('/routes').then(r => { setRoutes(r.data.routes); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      {/* Route List */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>All Routes</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{routes.length} routes configured</p>
        </div>

        {routes.map(route => (
          <div key={route._id} className="vehicle-card" style={{ marginBottom: 10, borderColor: selected?._id === route._id ? 'var(--accent-blue)' : 'var(--border)' }}
            onClick={() => setSelected(selected?._id === route._id ? null : route)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 4, height: 40, borderRadius: 2, background: route.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: route.color }}>{route.routeId}</span>
                  <span className={`badge badge-${route.status}`}>{route.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{route.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>{route.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>🛣 {route.totalDistance} km</span>
                  <span>⏱ {route.estimatedDuration} min</span>
                  <span>🔄 Every {route.frequency} min</span>
                  <span>📍 {route.stops?.length} stops</span>
                </div>
              </div>
            </div>

            {/* Stop sequence preview */}
            {route.stops?.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
                  {route.stops.map((s, i) => (
                    <React.Fragment key={i}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: route.color, margin: '0 auto 3px', border: '2px solid rgba(255,255,255,0.2)' }}/>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.stop?.code || `S${i+1}`}
                        </div>
                      </div>
                      {i < route.stops.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: `${route.color}40`, minWidth: 16 }}/>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Route Detail */}
      <div>
        {selected ? (
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 5, height: 32, borderRadius: 3, background: selected.color }}/>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: selected.color }}>{selected.routeId}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.name}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { l: 'Distance', v: `${selected.totalDistance} km` },
                { l: 'Duration', v: `${selected.estimatedDuration} min` },
                { l: 'Frequency', v: `${selected.frequency} min` },
                { l: 'Type', v: selected.type },
                { l: 'Status', v: selected.status },
                { l: 'Stops', v: selected.stops?.length },
              ].map(item => (
                <div key={item.l} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{item.v}</div>
                </div>
              ))}
            </div>

            {selected.fare && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Fare</div>
                <div style={{ fontSize: 13 }}>Base: ₹{selected.fare.base} + ₹{selected.fare.perKm}/km</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Stop Sequence</div>
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: `${selected.color}30`, borderRadius: 1 }}/>
                {selected.stops?.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, position: 'relative' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color, flexShrink: 0, position: 'absolute', left: -18, top: 2, border: '2px solid var(--bg-card)' }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.stop?.name || `Stop ${i+1}`}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {s.distanceFromPrev > 0 && `+${s.distanceFromPrev}km · `}
                        {s.estimatedTravelTime > 0 && `${s.estimatedTravelTime} min`}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>#{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected.description && (
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {selected.description}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⛓</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Select a Route</div>
            <div style={{ fontSize: 12 }}>Click on any route to view detailed information</div>
          </div>
        )}
      </div>
    </div>
  );
}
