'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResetHint, setShowResetHint] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: 'Login failed' }))) as { error?: string };
      setError(payload.error ?? 'Login failed');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <main>
      <section className="admin-card" style={{ maxWidth: 480, margin: '40px auto' }}>
        <h1>Admin Login</h1>
        <p>Use your assigned Admin ID and password.</p>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="identifier">Admin ID</label>
            <input
              id="identifier"
              className="admin-input"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="e.g. developerdlboss.com"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="admin-btn secondary"
              onClick={() => setShowResetHint((state) => !state)}
              style={{ width: '100%' }}
            >
              Forgot Password?
            </button>
            {showResetHint ? <p style={{ marginTop: 8 }}>Please contact the developer for resetting your password.</p> : null}
          </div>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          <button className="admin-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}
