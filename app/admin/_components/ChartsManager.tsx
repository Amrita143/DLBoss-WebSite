'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CHART_DAY_KEYS, normalizeChartCellStyles, type ChartDayKey } from '@/lib/chart-display';
import type { ChartCellStyle, ChartCellStyles, ChartRecord, Market } from '@/lib/types';

interface Props {
  initialRecords: ChartRecord[];
  initialTotal: number;
  pageSize: number;
  markets: Market[];
}

type ChartTypeFilter = 'all' | 'jodi' | 'panel';
type WeekdayFilter = 'all' | ChartDayKey;

interface ChartDraft {
  market_id: string;
  chart_type: 'jodi' | 'panel';
  week_start: string;
  week_end: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  source_year_label: string;
  cell_styles: ChartCellStyles;
}

const DEFAULT_TEXT_COLOR = '#ff0000';
const DEFAULT_HIGHLIGHT_COLOR = '#fff200';

function createDefaultForm(marketId: string): ChartDraft {
  return {
    market_id: marketId,
    chart_type: 'jodi',
    week_start: '',
    week_end: '',
    mon: '**',
    tue: '**',
    wed: '**',
    thu: '**',
    fri: '**',
    sat: '**',
    sun: '**',
    source_year_label: new Date().getFullYear().toString(),
    cell_styles: {}
  };
}

function getCellStyle(styles: ChartCellStyles | null | undefined, day: ChartDayKey): ChartCellStyle {
  return normalizeChartCellStyles(styles)[day] ?? {};
}

function updateCellStyle(
  styles: ChartCellStyles | null | undefined,
  day: ChartDayKey,
  field: keyof ChartCellStyle,
  value: string | null
): ChartCellStyles {
  const next = { ...normalizeChartCellStyles(styles) };
  const current = { ...(next[day] ?? {}) };

  if (!value) {
    delete current[field];
  } else {
    current[field] = value;
  }

  if (Object.keys(current).length === 0) {
    delete next[day];
  } else {
    next[day] = current;
  }

  return next;
}

function formatDayLabel(day: ChartDayKey) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function DayEditor(props: {
  day: ChartDayKey;
  value: string;
  styleState: ChartCellStyle;
  onValueChange: (value: string) => void;
  onToggleTextColor: (enabled: boolean) => void;
  onTextColorChange: (value: string) => void;
  onToggleHighlight: (enabled: boolean) => void;
  onHighlightColorChange: (value: string) => void;
}) {
  const { day, value, styleState, onValueChange, onToggleTextColor, onTextColorChange, onToggleHighlight, onHighlightColorChange } = props;

  return (
    <div className="chart-day-editor">
      <label className="chart-day-label">{formatDayLabel(day)}</label>
      <input className="admin-input" value={value} onChange={(event) => onValueChange(event.target.value)} />
      <label className="chart-style-row">
        <input type="checkbox" checked={Boolean(styleState.textColor)} onChange={(event) => onToggleTextColor(event.target.checked)} />
        Color numbers
      </label>
      {styleState.textColor ? (
        <input type="color" value={styleState.textColor || DEFAULT_TEXT_COLOR} onChange={(event) => onTextColorChange(event.target.value)} />
      ) : null}
      <label className="chart-style-row">
        <input type="checkbox" checked={Boolean(styleState.highlightColor)} onChange={(event) => onToggleHighlight(event.target.checked)} />
        Highlight
      </label>
      {styleState.highlightColor ? (
        <input
          type="color"
          value={styleState.highlightColor || DEFAULT_HIGHLIGHT_COLOR}
          onChange={(event) => onHighlightColorChange(event.target.value)}
        />
      ) : null}
    </div>
  );
}

function DaySummary(props: { record: ChartRecord; showSunday: boolean }) {
  const visibleDays = props.showSunday ? CHART_DAY_KEYS : CHART_DAY_KEYS.slice(0, 6);

  return (
    <div className="chart-day-summary">
      {visibleDays.map((day) => {
        const styleState = getCellStyle(props.record.cell_styles, day);
        const style: React.CSSProperties = {};
        if (styleState.textColor) {
          style.color = styleState.textColor;
        }
        if (styleState.highlightColor) {
          style.backgroundColor = styleState.highlightColor;
        }

        return (
          <div key={day}>
            <strong>{formatDayLabel(day)}:</strong> <span style={style}>{props.record[day]}</span>
          </div>
        );
      })}
    </div>
  );
}

function PaginationControls(props: {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const { currentPage, totalPages, totalRecords, pageSize, loading, onPageChange } = props;

  if (totalRecords === 0) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="admin-pagination">
      <p className="admin-pagination-summary">
        Showing {start}-{end} of {totalRecords} records
      </p>
      <div className="admin-pagination-controls">
        <button
          className="admin-btn secondary"
          type="button"
          disabled={loading || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Prev
        </button>
        {pages.map((page) => (
          <button
            key={page}
            className={`admin-btn secondary${page === currentPage ? ' active' : ''}`}
            type="button"
            disabled={loading || page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="admin-btn secondary"
          type="button"
          disabled={loading || currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ChartsManager({ initialRecords, initialTotal, pageSize, markets }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [totalRecords, setTotalRecords] = useState(initialTotal);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [chartTypeFilter, setChartTypeFilter] = useState<ChartTypeFilter>('all');
  const [weekdayFilter, setWeekdayFilter] = useState<WeekdayFilter>('all');
  const [form, setForm] = useState<ChartDraft>(createDefaultForm(markets[0]?.id ?? ''));
  const didMountRef = useRef(false);

  const marketById = useMemo(() => {
    const map = new Map<string, Market>();
    for (const market of markets) {
      map.set(market.id, market);
    }
    return map;
  }, [markets]);

  async function readErrorMessage(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => ({ error: fallback }))) as { error?: string };
    return payload.error ?? fallback;
  }

  async function refresh(page = currentPage, filters?: { marketId?: string; chartType?: ChartTypeFilter }) {
    setLoadingPage(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    const marketId = filters?.marketId ?? marketFilter;
    const chartType = filters?.chartType ?? chartTypeFilter;

    if (marketId !== 'all') {
      params.set('marketId', marketId);
    }

    if (chartType !== 'all') {
      params.set('chartType', chartType);
    }

    const response = await fetch(`/api/admin/charts?${params.toString()}`);

    if (!response.ok) {
      setError(await readErrorMessage(response, 'Failed to load chart records'));
      setLoadingPage(false);
      return;
    }

    const payload = (await response.json()) as { items: ChartRecord[]; total: number; page: number };
    setRecords(payload.items ?? []);
    setTotalRecords(payload.total ?? 0);
    setCurrentPage(payload.page ?? page);
    setLoadingPage(false);
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    void refresh(currentPage);
  }, [currentPage, marketFilter, chartTypeFilter]);

  async function createRecord() {
    setError('');
    const response = await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError(await readErrorMessage(response, 'Failed to create chart record'));
      return;
    }

    setForm(createDefaultForm(markets[0]?.id ?? ''));
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    await refresh(1);
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
        sun: row.sun,
        source_year_label: row.source_year_label,
        cell_styles: normalizeChartCellStyles(row.cell_styles)
      })
    });

    if (!response.ok) {
      setError(await readErrorMessage(response, 'Failed to update chart record'));
      return;
    }

    setEditingId(null);
    await refresh(currentPage);
  }

  async function removeRecord(id: string) {
    if (!confirm('Delete this chart row?')) {
      return;
    }

    const response = await fetch(`/api/admin/charts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError(await readErrorMessage(response, 'Failed to delete chart record'));
      return;
    }

    const remainingTotal = Math.max(totalRecords - 1, 0);
    const lastPageAfterDelete = Math.max(1, Math.ceil(remainingTotal / pageSize));
    const targetPage = Math.min(currentPage, lastPageAfterDelete);

    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      return;
    }

    await refresh(targetPage);
  }

  function patchFormDay(day: ChartDayKey, value: string) {
    setForm((state) => ({ ...state, [day]: value }));
  }

  function patchFormCellStyle(day: ChartDayKey, field: keyof ChartCellStyle, value: string | null) {
    setForm((state) => ({ ...state, cell_styles: updateCellStyle(state.cell_styles, day, field, value) }));
  }

  function patchRowValue(id: string, field: keyof ChartRecord, value: string) {
    setRecords((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function patchRowCellStyle(id: string, day: ChartDayKey, field: keyof ChartCellStyle, value: string | null) {
    setRecords((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              cell_styles: updateCellStyle(row.cell_styles, day, field, value)
            }
          : row
      )
    );
  }

  const selectedMarket = marketById.get(form.market_id);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const visibleDaysForRecord = (market?: Market) => {
    if (weekdayFilter !== 'all') {
      return [weekdayFilter];
    }

    return market?.show_sunday ? CHART_DAY_KEYS : CHART_DAY_KEYS.slice(0, 6);
  };

  function handleMarketFilterChange(value: string) {
    setEditingId(null);
    setError('');
    setMarketFilter(value);
    setCurrentPage(1);
  }

  function handleChartTypeFilterChange(value: ChartTypeFilter) {
    setEditingId(null);
    setError('');
    setChartTypeFilter(value);
    setCurrentPage(1);
  }

  function handleWeekdayFilterChange(value: WeekdayFilter) {
    setEditingId(null);
    setWeekdayFilter(value);
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Save Chart Record</h3>
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
          <input
            className="admin-input"
            placeholder="source year"
            value={form.source_year_label}
            onChange={(event) => setForm((state) => ({ ...state, source_year_label: event.target.value }))}
          />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13 }}>
          Sunday values are only shown publicly when the selected market has <strong>Show Sunday</strong> enabled in Manage Markets. Current setting:{' '}
          {selectedMarket?.show_sunday ? 'Mon - Sun' : 'Mon - Sat'}
        </p>
        <div className="chart-day-grid">
          {CHART_DAY_KEYS.map((day) => (
            <DayEditor
              key={day}
              day={day}
              value={form[day]}
              styleState={getCellStyle(form.cell_styles, day)}
              onValueChange={(value) => patchFormDay(day, value)}
              onToggleTextColor={(enabled) => patchFormCellStyle(day, 'textColor', enabled ? getCellStyle(form.cell_styles, day).textColor || DEFAULT_TEXT_COLOR : null)}
              onTextColorChange={(value) => patchFormCellStyle(day, 'textColor', value)}
              onToggleHighlight={(enabled) =>
                patchFormCellStyle(day, 'highlightColor', enabled ? getCellStyle(form.cell_styles, day).highlightColor || DEFAULT_HIGHLIGHT_COLOR : null)
              }
              onHighlightColorChange={(value) => patchFormCellStyle(day, 'highlightColor', value)}
            />
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createRecord}>
            Save Chart Record
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Latest Chart Records</h3>
        <div className="admin-filter-bar">
          <label>
            <span>Filter by Market</span>
            <select className="admin-select" value={marketFilter} onChange={(event) => handleMarketFilterChange(event.target.value)}>
              <option value="all">All Markets</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Filter by Type</span>
            <select
              className="admin-select"
              value={chartTypeFilter}
              onChange={(event) => handleChartTypeFilterChange(event.target.value as ChartTypeFilter)}
            >
              <option value="all">All Types</option>
              <option value="jodi">Jodi</option>
              <option value="panel">Panel</option>
            </select>
          </label>
          <label>
            <span>Filter by Weekday</span>
            <select
              className="admin-select"
              value={weekdayFilter}
              onChange={(event) => handleWeekdayFilterChange(event.target.value as WeekdayFilter)}
            >
              <option value="all">All Weekdays</option>
              {CHART_DAY_KEYS.map((day) => (
                <option key={day} value={day}>
                  {formatDayLabel(day)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          loading={loadingPage}
          onPageChange={setCurrentPage}
        />
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Market</th>
              <th>Week</th>
              <th>Days</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const editable = editingId === record.id;
              const market = marketById.get(record.market_id);
              const visibleDays = visibleDaysForRecord(market);

              return (
                <tr key={record.id}>
                  <td>{record.chart_type}</td>
                  <td>{market?.name ?? record.market_id}</td>
                  <td>
                    {editable ? (
                      <>
                        <input
                          className="admin-input"
                          value={record.week_start}
                          onChange={(event) => patchRowValue(record.id, 'week_start', event.target.value)}
                        />
                        <input className="admin-input" value={record.week_end} onChange={(event) => patchRowValue(record.id, 'week_end', event.target.value)} />
                      </>
                    ) : (
                      <>
                        {record.week_start} to {record.week_end}
                      </>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <div className="chart-day-grid">
                        {visibleDays.map((day) => (
                          <DayEditor
                            key={day}
                            day={day}
                            value={record[day]}
                            styleState={getCellStyle(record.cell_styles, day)}
                            onValueChange={(value) => patchRowValue(record.id, day, value)}
                            onToggleTextColor={(enabled) =>
                              patchRowCellStyle(
                                record.id,
                                day,
                                'textColor',
                                enabled ? getCellStyle(record.cell_styles, day).textColor || DEFAULT_TEXT_COLOR : null
                              )
                            }
                            onTextColorChange={(value) => patchRowCellStyle(record.id, day, 'textColor', value)}
                            onToggleHighlight={(enabled) =>
                              patchRowCellStyle(
                                record.id,
                                day,
                                'highlightColor',
                                enabled ? getCellStyle(record.cell_styles, day).highlightColor || DEFAULT_HIGHLIGHT_COLOR : null
                              )
                            }
                            onHighlightColorChange={(value) => patchRowCellStyle(record.id, day, 'highlightColor', value)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="chart-day-summary">
                        {visibleDays.map((day) => {
                          const styleState = getCellStyle(record.cell_styles, day);
                          const style: React.CSSProperties = {};

                          if (styleState.textColor) {
                            style.color = styleState.textColor;
                          }

                          if (styleState.highlightColor) {
                            style.backgroundColor = styleState.highlightColor;
                          }

                          return (
                            <div key={day}>
                              <strong>{formatDayLabel(day)}:</strong> <span style={style}>{record[day]}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        className="admin-input"
                        value={record.source_year_label}
                        onChange={(event) => patchRowValue(record.id, 'source_year_label', event.target.value)}
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
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          loading={loadingPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
