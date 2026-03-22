'use client';

import { useState } from 'react';
import type { Market } from '@/lib/types';

interface Props {
  initialMarkets: Market[];
}

const defaultForm = {
  slug: '',
  name: '',
  sort_order: 999,
  open_time: '',
  close_time: '',
  has_jodi: true,
  has_panel: true,
  show_sunday: false,
  is_highlighted: false,
  highlight_color: '#fff200'
};

export function MarketsManager({ initialMarkets }: Props) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);

  async function refresh() {
    const response = await fetch('/api/admin/markets');
    const payload = (await response.json()) as { items: Market[] };
    setMarkets(payload.items ?? []);
  }

  async function createMarket() {
    setError('');
    const response = await fetch('/api/admin/markets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError('Failed to create market');
      return;
    }

    setForm(defaultForm);
    await refresh();
  }

  async function updateMarket(id: string, patch: Partial<Market>) {
    setError('');
    const response = await fetch(`/api/admin/markets/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      setError('Failed to update market');
      return;
    }

    await refresh();
  }

  async function removeMarket(id: string) {
    if (!confirm('Delete this market?')) {
      return;
    }

    const response = await fetch(`/api/admin/markets/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete market');
      return;
    }

    await refresh();
  }

  function patchMarket<K extends keyof Market>(id: string, field: K, value: Market[K]) {
    setMarkets((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Create Market</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }}>
          <input
            className="admin-input"
            placeholder="slug (e.g. kalyan)"
            value={form.slug}
            onChange={(event) => setForm((state) => ({ ...state, slug: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="name"
            value={form.name}
            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
          />
          <input
            className="admin-input"
            type="number"
            placeholder="sort order"
            value={form.sort_order}
            onChange={(event) => setForm((state) => ({ ...state, sort_order: Number(event.target.value) }))}
          />
          <input
            className="admin-input"
            placeholder="open time (e.g. 09:30 AM)"
            value={form.open_time}
            onChange={(event) => setForm((state) => ({ ...state, open_time: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="close time (e.g. 11:00 PM)"
            value={form.close_time}
            onChange={(event) => setForm((state) => ({ ...state, close_time: event.target.value }))}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              <input
                type="checkbox"
                checked={form.has_jodi}
                onChange={(event) => setForm((state) => ({ ...state, has_jodi: event.target.checked }))}
              />{' '}
              Jodi
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.has_panel}
                onChange={(event) => setForm((state) => ({ ...state, has_panel: event.target.checked }))}
              />{' '}
              Panel
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.show_sunday}
                onChange={(event) => setForm((state) => ({ ...state, show_sunday: event.target.checked }))}
              />{' '}
              Show Sunday
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              <input
                type="checkbox"
                checked={form.is_highlighted}
                onChange={(event) => setForm((state) => ({ ...state, is_highlighted: event.target.checked }))}
              />{' '}
              Highlight market
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Highlight color
              <input
                type="color"
                value={form.highlight_color}
                onChange={(event) => setForm((state) => ({ ...state, highlight_color: event.target.value }))}
              />
            </label>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createMarket}>
            Create Market
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Manage Markets</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Open</th>
              <th>Close</th>
              <th>Sort</th>
              <th>Status</th>
              <th>Charts</th>
              <th>Open Days</th>
              <th>Highlight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <tr key={market.id}>
                <td>
                  <input
                    className="admin-input"
                    value={market.name}
                    onChange={(event) => patchMarket(market.id, 'name', event.target.value)}
                  />
                </td>
                <td>{market.slug}</td>
                <td>
                  <input
                    className="admin-input"
                    value={market.open_time ?? ''}
                    onChange={(event) => patchMarket(market.id, 'open_time', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="admin-input"
                    value={market.close_time ?? ''}
                    onChange={(event) => patchMarket(market.id, 'close_time', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="admin-input"
                    type="number"
                    value={market.sort_order}
                    onChange={(event) => patchMarket(market.id, 'sort_order', Number(event.target.value))}
                  />
                </td>
                <td>
                  <select
                    className="admin-select"
                    value={market.status}
                    onChange={(event) => patchMarket(market.id, 'status', event.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      checked={market.has_jodi}
                      onChange={(event) => patchMarket(market.id, 'has_jodi', event.target.checked)}
                    />{' '}
                    Jodi
                  </label>
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      checked={market.has_panel}
                      onChange={(event) => patchMarket(market.id, 'has_panel', event.target.checked)}
                    />{' '}
                    Panel
                  </label>
                </td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      checked={market.show_sunday}
                      onChange={(event) => patchMarket(market.id, 'show_sunday', event.target.checked)}
                    />{' '}
                    Sunday enabled
                  </label>
                </td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      checked={market.is_highlighted}
                      onChange={(event) => patchMarket(market.id, 'is_highlighted', event.target.checked)}
                    />{' '}
                    Active
                  </label>
                  <div style={{ marginTop: 6 }}>
                    <input
                      type="color"
                      value={market.highlight_color || '#fff200'}
                      onChange={(event) => patchMarket(market.id, 'highlight_color', event.target.value)}
                    />
                  </div>
                </td>
                <td>
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() =>
                      updateMarket(market.id, {
                        name: market.name,
                        open_time: market.open_time ?? '',
                        close_time: market.close_time ?? '',
                        sort_order: market.sort_order,
                        status: market.status,
                        has_jodi: market.has_jodi,
                        has_panel: market.has_panel,
                        show_sunday: market.show_sunday,
                        is_highlighted: market.is_highlighted,
                        highlight_color: market.highlight_color
                      })
                    }
                  >
                    Save
                  </button>{' '}
                  <button className="admin-btn secondary" type="button" onClick={() => removeMarket(market.id)}>
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
