'use client';

import { useState } from 'react';

interface Props {
  initialSettings: Array<{ id: string; setting_key: string; setting_value: Record<string, unknown> }>;
}

export function SettingsManager({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [key, setKey] = useState('homepage_rotating_phrases');
  const [value, setValue] = useState('["Fix Ank","Kalyan Fix","Milan Fix","Fix open","Fix close","Fix jodi"]');
  const [error, setError] = useState('');

  async function refresh() {
    const response = await fetch('/api/admin/settings');
    const payload = (await response.json()) as { items: Array<{ id: string; setting_key: string; setting_value: Record<string, unknown> }> };
    setSettings(payload.items ?? []);
  }

  async function save() {
    setError('');
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch {
      setError('Value must be valid JSON');
      return;
    }

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setting_key: key, setting_value: parsed })
    });

    if (!response.ok) {
      setError('Failed to save setting');
      return;
    }

    await refresh();
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Upsert Setting</h3>
        <input className="admin-input" value={key} onChange={(event) => setKey(event.target.value)} />
        <textarea className="admin-textarea" value={value} onChange={(event) => setValue(event.target.value)} />
        <button className="admin-btn" type="button" onClick={save}>
          Save
        </button>
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      </div>

      <div className="admin-card">
        <h3>Current Settings</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((item) => (
              <tr key={item.id}>
                <td>{item.setting_key}</td>
                <td>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(item.setting_value)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
