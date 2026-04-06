import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { API } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOpts = (extra = {}) => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2.2,
  plugins: {
    legend: { labels: { color: '#8b9cc8', font: { family: 'Space Grotesk', size: 12 } } },
    tooltip: {
      backgroundColor: '#1a2436',
      titleColor: '#f0f4ff',
      bodyColor: '#8b9cc8',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1
    }
  },
  scales: {
    x: { ticks: { color: '#4a5568', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#4a5568', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
  },
  ...extra
});

const doughnutOpts = () => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#8b9cc8', font: { family: 'Space Grotesk', size: 12 } }
    },
    tooltip: {
      backgroundColor: '#1a2436',
      titleColor: '#f0f4ff',
      bodyColor: '#8b9cc8',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1
    }
  }
});

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [routeStats, setRouteStats] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/analytics/dashboard'),
      API.get('/analytics/hourly'),
      API.get('/analytics/routes'),
      API.get('/analytics/occupancy'),
    ]).then(([s, h, r, o]) => {
      setStats(s.data.stats);
      setHourly(h.data.hourlyData);
      setRouteStats(r.data.routes);
      setOccupancy(o.data.occupancyByType);
    }).catch(err => console.error('Analytics load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const passengerData = {
    labels: hourly.map(h => h.label),
    datasets: [{
      label: 'Passengers',
      data: hourly.map(h => h.passengers),
      backgroundColor: 'rgba(59,130,246,0.15)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    }]
  };

  const delayData = {
    labels: hourly.map(h => h.label),
    datasets: [{
      label: 'Avg Delay (min)',
      data: hourly.map(h => h.avgDelay),
      backgroundColor: hourly.map(h =>
        h.avgDelay > 5 ? 'rgba(239,68,68,0.6)' :
        h.avgDelay > 2 ? 'rgba(245,158,11,0.6)' :
        'rgba(16,185,129,0.6)'
      ),
      borderRadius: 3,
    }]
  };

  const activeVehicleData = {
    labels: hourly.map(h => h.label),
    datasets: [{
      label: 'Active Vehicles',
      data: hourly.map(h => h.activeVehicles),
      backgroundColor: 'rgba(16,185,129,0.15)',
      borderColor: '#10b981',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  };

  const occDoughnut = {
    labels: occupancy.map(o => o.type || o._id),
    datasets: [{
      data: occupancy.map(o => o.avgOccupancy),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      borderColor: '#0d1320',
      borderWidth: 3,
    }]
  };

  const routeDelayData = {
    labels: routeStats.map(r => r.routeId || '—'),
    datasets: [{
      label: 'Avg Delay (min)',
      data: routeStats.map(r => r.avgDelay),
      backgroundColor: routeStats.map(r => (r.color || '#3b82f6') + '80'),
      borderColor: routeStats.map(r => r.color || '#3b82f6'),
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const onTimeRate = stats?.delays?.total > 0
    ? Math.round((stats.delays.onTimeCount / stats.delays.total) * 100)
    : 0;

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'On-Time Rate', value: `${onTimeRate}%`, sub: `${stats?.delays?.onTimeCount || 0} vehicles on time`, color: 'var(--accent-green)' },
          { label: 'Avg Delay', value: `${stats?.delays?.avgDelay?.toFixed(1) || '0.0'} min`, sub: `Max: ${stats?.delays?.maxDelay || 0} min`, color: 'var(--accent-amber)' },
          { label: 'Avg Occupancy', value: `${stats?.avgOccupancy || 0}%`, sub: 'Fleet average', color: 'var(--accent-blue)' },
          { label: 'Active Routes', value: `${stats?.routes?.active || 0}/${stats?.routes?.total || 0}`, sub: 'Routes in operation', color: 'var(--accent-purple)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hourly Passenger Traffic</div>
            <div className="card-subtitle">Today's ridership pattern</div>
          </div>
          <Line data={passengerData} options={chartOpts()} />
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hourly Delay Pattern</div>
            <div className="card-subtitle">Average delay by hour</div>
          </div>
          <Bar data={delayData} options={chartOpts()} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Route Delay Comparison</div>
            <div className="card-subtitle">Performance by route</div>
          </div>
          {routeStats.length > 0
            ? <Bar data={routeDelayData} options={chartOpts({ indexAxis: 'y' })} />
            : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No route data</div>
          }
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Occupancy by Vehicle Type</div>
            <div className="card-subtitle">Average load factor</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: 1, maxWidth: 200 }}>
              {occupancy.length > 0
                ? <Doughnut data={occDoughnut} options={doughnutOpts()} />
                : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No data</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              {occupancy.map((o, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{o.type || o._id}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{o.avgOccupancy}%</span>
                  </div>
                  <div className="occ-bar" style={{ height: 6 }}>
                    <div
                      className={`occ-bar-fill ${o.avgOccupancy < 50 ? 'occ-low' : o.avgOccupancy < 80 ? 'occ-mid' : 'occ-high'}`}
                      style={{ width: `${o.avgOccupancy}%` }}
                    />
                  </div>
                </div>
              ))}
              {occupancy.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No active vehicles</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Active Vehicles Timeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Active Fleet Deployment</div>
          <div className="card-subtitle">Number of vehicles in service by hour</div>
        </div>
        <Line data={activeVehicleData} options={chartOpts({ aspectRatio: 4 })} />
      </div>

      {/* Route Performance Table */}
      {routeStats.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Route Performance Summary</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Type</th>
                <th>Active / Total</th>
                <th>Avg Delay</th>
                <th>Avg Occupancy</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {routeStats.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color || '#3b82f6' }}/>
                      <span className="primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.routeId}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{r.type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.activeCount}/{r.vehicleCount}</td>
                  <td style={{ color: r.avgDelay > 5 ? 'var(--accent-red)' : r.avgDelay > 2 ? 'var(--accent-amber)' : 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {r.avgDelay > 0 ? `+${r.avgDelay}m` : 'On time'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="occ-bar" style={{ width: 64 }}>
                        <div
                          className={`occ-bar-fill ${(r.avgOccupancy || 0) < 50 ? 'occ-low' : (r.avgOccupancy || 0) < 80 ? 'occ-mid' : 'occ-high'}`}
                          style={{ width: `${r.avgOccupancy || 0}%` }}
                        />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.avgOccupancy || 0}%</span>
                    </div>
                  </td>
                  <td>
                    {r.avgDelay <= 2 && <span className="badge badge-active">On Time</span>}
                    {r.avgDelay > 2 && r.avgDelay <= 5 && <span className="badge badge-delayed">Minor Delay</span>}
                    {r.avgDelay > 5 && <span className="badge badge-high">Delayed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
