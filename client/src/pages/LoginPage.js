import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    const creds = {
      admin: { email: 'admin@transport.gov.in', password: 'admin123' },
      operator: { email: 'operator@transport.gov.in', password: 'operator123' },
      viewer: { email: 'viewer@transport.gov.in', password: 'viewer123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="auth-wrapper">
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚇</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Smart<span style={{ color: 'var(--accent-cyan)' }}>Transit</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Chandigarh Public Transport Monitoring System
          </p>
        </div>

        <div className="auth-card">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Sign in</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
            Access the operations dashboard
          </p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="user@transport.gov.in"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8, fontSize: 14 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }}/> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
              Demo Accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['admin', 'operator', 'viewer'].map(role => (
                <button key={role} className="btn btn-ghost btn-sm" onClick={() => quickLogin(role)}
                  style={{ justifyContent: 'center', textTransform: 'capitalize' }}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
          Smart Public Transport Monitoring System v1.0
        </p>
      </div>
    </div>
  );
}
