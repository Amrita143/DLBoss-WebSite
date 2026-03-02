'use client';

import { useMemo, useState } from 'react';
import type { ChartRecord, Market } from '@/lib/types';

interface Props {
  initialRecords: ChartRecord[];
  markets: Market[];
}

export function ChartsManager({ initialRecords, markets }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    market_id: markets[0]?.id ?? '',
    chart_type: 'jodi' as 'jodi' | 'panel',
    week_start: '',
    week_end: '',
    mon: '**',
    tue: '**',
    wed: '**',
    thu: '**',
    fri: '**',
    sat: '**',
    source_year_label: new Date().getFullYear().toString()
  });

  const marketById = useMemo(() => {
    const map = new Map<string, Market>();
    for (const market of markets) {
      map.set(market.id, market);
    }
    return map;
  }, [markets]);

  async function refresh() {
    const response = await fetch('/api/admin/charts?limit=200');
    const payload = (await response.json()) as { items: ChartRecord[] };
    setRecords(payload.items ?? []);
  }

  async function createRecord() {
    setError('');
    const response = await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError('Failed to create chart record');
      return;
    }

    await refresh();
  }

  async function updateRecord(row: ChartRecord) {
    const response = await fetch(`/api/admin/charts/${row.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        week_start: row.week_start,
        week_end: row.week_end,
        mon: row.mon,
        tue: row.tue,
        wed: row.wed,
        thu: row.thu,
        fri: row.fri,
        sat: row.sat,
        source_year_label: row.source_year_label
      })
    });

    if (!response.ok) {
      setError('Failed to update chart record');
      return;
    }

    setEditingId(null);
    await refresh();
  }

  async function removeRecord(id: string) {
    if (!confirm('Delete this chart row?')) {
      return;
    }

    const response = await fetch(`/api/admin/charts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete chart record');
      return;
    }

    await refresh();
  }

  function patchRow(id: string, field: keyof ChartRecord, value: string) {
    setRecords((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Create Chart Record</h3>
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
          <select
            className="admin-select"
            value={form.chart_type}
            onChange={(event) => setForm((state) => ({ ...state, chart_type: event.target.value as 'jodi' | 'panel' }))}
          >
            <option value="jodi">jodi</option>
            <option value="panel">panel</option>
          </select>
          <input
            className="admin-input"
            placeholder="week_start (YYYY-MM-DD)"
            value={form.week_start}
            onChange={(event) => setForm((state) => ({ ...state, week_start: event.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="week_end (YYYY-MM-DD)"
            value={form.week_end}
            onChange={(event) => setForm((state) => ({ ...state, week_end: event.target.value }))}
          />
          {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => (
            <input
              key={day}
              className="admin-input"
              placeholder={day}
              value={form[day]}
              onChange={(event) => setForm((state) => ({ ...state, [day]: event.target.value }))}
            />
          ))}
          <input
            className="admin-input"
            placeholder="source year"
            value={form.source_year_label}
            onChange={(event) => setForm((state) => ({ ...state, source_year_label: event.target.value }))}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createRecord}>
            Create
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Latest Chart Records</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Market</th>
              <th>Week</th>
              <th>Mon-Sat</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const editable = editingId === record.id;
              return (
                <tr key={record.id}>
                  <td>{record.chart_type}</td>
                  <td>{marketById.get(record.market_id)?.name ?? record.market_id}</td>
                  <td>
                    {editable ? (
                      <>
                        <input
                          className="admin-input"
                          value={record.week_start}
                          onChange={(event) => patchRow(record.id, 'week_start', event.target.value)}
                        />
                        <input
                          className="admin-input"
                          value={record.week_end}
                          onChange={(event) => patchRow(record.id, 'week_end', event.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        {record.week_start} to {record.week_end}
                      </>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 4 }}>
                        {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => (
                          <input
                            key={day}
                            className="admin-input"
                            value={record[day]}
                            onChange={(event) => patchRow(record.id, day, event.target.value)}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        {record.mon} {record.tue} {record.wed} {record.thu} {record.fri} {record.sat}
                      </>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        className="admin-input"
                        value={record.source_year_label}
                        onChange={(event) => patchRow(record.id, 'source_year_label', event.target.value)}
                      />
                    ) : (
                      record.source_year_label
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <>
                        <button className="admin-btn" type="button" onClick={() => updateRecord(record)}>
                          Save
                        </button>{' '}
                        <button className="admin-btn secondary" type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn secondary" type="button" onClick={() => setEditingId(record.id)}>
                          Edit
                        </button>{' '}
                        <button className="admin-btn secondary" type="button" onClick={() => removeRecord(record.id)}>
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
