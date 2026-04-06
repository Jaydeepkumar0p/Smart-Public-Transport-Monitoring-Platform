import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { to: '/dashboard', icon: '▦', label: 'Dashboard' },
      { to: '/map',       icon: '◎', label: 'Live Map' },
      { to: '/alerts',    icon: '⚡', label: 'Alerts', badge: true },
    ]
  },
  {
    label: 'Fleet',
    items: [
      { to: '/vehicles', icon: '🚌', label: 'Vehicles' },
      { to: '/routes',   icon: '⛓', label: 'Routes' },
      { to: '/stops',    icon: '📍', label: 'Stops' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', icon: '◈', label: 'Analytics' },
    ]
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/map':       'Live Map',
  '/alerts':    'Alerts',
  '/vehicles':  'Vehicles',
  '/routes':    'Routes',
  '/stops':     'Stops',
  '/analytics': 'Analytics',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { connected, alerts } = useSocket();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const activeAlerts = alerts.filter(a => a.isActive !== false).length;
  const pageTitle = PAGE_TITLES[location.pathname] || 'SmartTransit';

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarWidth,
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0,
        zIndex: 100,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}>
        {/* Logo / toggle */}
        <div
          onClick={() => setCollapsed(c => !c)}
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🚇
          </div>
          {!collapsed && (
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              SMART<span style={{ color: 'var(--accent-cyan)' }}>TRANSIT</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '1.2px',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  padding: '4px 8px 8px',
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                    position: 'relative',
                    marginBottom: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && activeAlerts > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--accent-red)',
                      color: 'white',
                      fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {activeAlerts}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
          <div
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>⏏</span>
            {!collapsed && <span>Logout</span>}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
            }}/>
            {!collapsed && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {connected ? 'Live' : 'Offline'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.25s ease',
      }}>
        {/* Topbar */}
        <header style={{
          height: 60,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{pageTitle}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Chandigarh Smart Transit Authority
            </div>
          </div>
          <div style={{ flex: 1 }} />

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
            color: 'var(--accent-green)', textTransform: 'uppercase',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent-green)',
              animation: 'pulse 2s infinite',
            }}/>
            Live
          </div>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'var(--bg-card)',
            borderRadius: 6, border: '1px solid var(--border)',
            fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>👤</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.name}</span>
            <span style={{
              padding: '2px 6px',
              background: 'rgba(59,130,246,0.15)',
              color: 'var(--accent-blue)',
              borderRadius: 10, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            }}>
              {user?.role}
            </span>
          </div>
        </header>

        <main style={{ padding: 24, flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
