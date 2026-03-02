'use client';

import { useMemo, useState } from 'react';
import type { Market, MarketResult } from '@/lib/types';

interface Props {
  initialResults: MarketResult[];
  markets: Market[];
}

export function ResultsManager({ initialResults, markets }: Props) {
  const [results, setResults] = useState(initialResults);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    market_id: markets[0]?.id ?? '',
    result_date: new Date().toISOString().slice(0, 10),
    open_panna: '',
    open_ank: '',
    close_panna: '',
    close_ank: '',
    jodi: '',
    notes: ''
  });

  const marketById = useMemo(() => {
    const map = new Map<string, Market>();
    for (const market of markets) {
      map.set(market.id, market);
    }
    return map;
  }, [markets]);

  async function refresh() {
    const response = await fetch('/api/admin/results?limit=200');
    const payload = (await response.json()) as { items: MarketResult[] };
    setResults(payload.items ?? []);
  }

  async function createOrUpsert() {
    setError('');
    const response = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError('Failed to save outcome');
      return;
    }

    await refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this outcome?')) {
      return;
    }

    const response = await fetch(`/api/admin/results/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete outcome');
      return;
    }

    await refresh();
  }

  async function updateRow(row: MarketResult) {
    const response = await fetch(`/api/admin/results/${row.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      setError('Failed to update outcome');
      return;
    }

    setEditingId(null);
    await refresh();
  }

  function patchRow(id: string, field: keyof MarketResult, value: string) {
    setResults((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Add Outcome</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }}>
          <select
            className="admin-select"
            value={form.market_id}
            onChange={(event) => setForm((state) => ({ ...state, market_id: event.target.value }))}
          >
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
          <input
            className="admin-input"
            type="date"
            value={form.result_date}
            onChange={(event) => setForm((state) => ({ ...state, result_date: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="open panna"
            value={form.open_panna}
            onChange={(event) => setForm((state) => ({ ...state, open_panna: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="open ank"
            value={form.open_ank}
            onChange={(event) => setForm((state) => ({ ...state, open_ank: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="close panna"
            value={form.close_panna}
            onChange={(event) => setForm((state) => ({ ...state, close_panna: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="close ank"
            value={form.close_ank}
            onChange={(event) => setForm((state) => ({ ...state, close_ank: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="jodi (optional)"
            value={form.jodi}
            onChange={(event) => setForm((state) => ({ ...state, jodi: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="notes"
            value={form.notes}
            onChange={(event) => setForm((state) => ({ ...state, notes: event.target.value }))}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createOrUpsert}>
            Save Outcome
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Recent Outcomes</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Market</th>
              <th>Open</th>
              <th>Close</th>
              <th>Jodi</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => {
              const editable = editingId === row.id;
              const market = marketById.get(row.market_id);
              return (
                <tr key={row.id}>
                  <td>
                    {editable ? (
                      <input
                        className="admin-input"
                        type="date"
                        value={row.result_date}
                        onChange={(event) => patchRow(row.id, 'result_date', event.target.value)}
                      />
                    ) : (
                      row.result_date
                    )}
                  </td>
                  <td>{market?.name ?? row.market_id}</td>
                  <td>
                    {editable ? (
                      <>
                        <input
                          className="admin-input"
                          value={row.open_panna ?? ''}
                          onChange={(event) => patchRow(row.id, 'open_panna', event.target.value)}
                        />
                        <input
                          className="admin-input"
                          value={row.open_ank ?? ''}
                          onChange={(event) => patchRow(row.id, 'open_ank', event.target.value)}
                        />
                      </>
                    ) : (
                      <>{row.open_panna || '--'} ({row.open_ank || '--'})</>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <>
                        <input
                          className="admin-input"
                          value={row.close_panna ?? ''}
                          onChange={(event) => patchRow(row.id, 'close_panna', event.target.value)}
                        />
                        <input
                          className="admin-input"
                          value={row.close_ank ?? ''}
                          onChange={(event) => patchRow(row.id, 'close_ank', event.target.value)}
                        />
                      </>
                    ) : (
                      <>{row.close_panna || '--'} ({row.close_ank || '--'})</>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <input className="admin-input" value={row.jodi ?? ''} onChange={(event) => patchRow(row.id, 'jodi', event.target.value)} />
                    ) : (
                      row.jodi || '--'
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <input className="admin-input" value={row.notes ?? ''} onChange={(event) => patchRow(row.id, 'notes', event.target.value)} />
                    ) : (
                      row.notes || '--'
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <>
                        <button className="admin-btn" type="button" onClick={() => updateRow(row)}>
                          Save
                        </button>{' '}
                        <button className="admin-btn secondary" type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn secondary" type="button" onClick={() => setEditingId(row.id)}>
                          Edit
                        </button>{' '}
                        <button className="admin-btn secondary" type="button" onClick={() => remove(row.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
