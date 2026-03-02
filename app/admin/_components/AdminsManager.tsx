'use client';

import { useState } from 'react';
import type { AdminUser } from '@/lib/types';

interface Props {
  initialAdmins: AdminUser[];
}

export function AdminsManager({ initialAdmins }: Props) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    login_id: '',
    password: '',
    role: 'admin' as 'admin' | 'superadmin'
  });

  async function refresh() {
    const response = await fetch('/api/admin/admins');
    const payload = (await response.json()) as { items?: AdminUser[] };
    if (!response.ok) {
      setError((payload as { error?: string }).error ?? 'Failed to load admins');
      return;
    }
    setAdmins(payload.items ?? []);
  }

  async function createAdmin() {
    setError('');
    setLoading(true);

    const response = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'Failed to create admin');
      setLoading(false);
      return;
    }

    setForm((state) => ({ ...state, login_id: '', password: '' }));
    setLoading(false);
    await refresh();
  }

  async function removeAdmin(row: AdminUser) {
    if (!confirm(`Delete admin "${row.login_id}"?`)) {
      return;
    }

    const response = await fetch(`/api/admin/admins/${row.id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'Failed to delete admin');
      return;
    }

    await refresh();
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Create Admin</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          <input
            className="admin-input"
            placeholder="Admin ID (e.g. manager01)"
            value={form.login_id}
            onChange={(event) => setForm((state) => ({ ...state, login_id: event.target.value }))}
          />
          <input
            className="admin-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
          />
          <select
            className="admin-select"
            value={form.role}
            onChange={(event) => setForm((state) => ({ ...state, role: event.target.value as 'admin' | 'superadmin' }))}
          >
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createAdmin} disabled={loading}>
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Existing Admins</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin ID</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((row) => (
              <tr key={row.id}>
                <td>{row.login_id}</td>
                <td>{row.role}</td>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>
                  <button className="admin-btn secondary" type="button" onClick={() => removeAdmin(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
