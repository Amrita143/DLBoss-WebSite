import type { ChartRecord, Market } from '@/lib/types';
import {
  formatDisplayDate,
  getChartCellStyle,
  getChartYearRange,
  getOpenDaysLabel,
  getVisibleDayKeys,
  parsePanelParts,
  sanitizeHexColor,
  type ChartDayKey
} from '@/lib/chart-display';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInlineStyle(textColor?: string | null, highlightColor?: string | null) {
  const declarations: string[] = [];
  const safeTextColor = sanitizeHexColor(textColor);
  const safeHighlightColor = sanitizeHexColor(highlightColor);

  if (safeTextColor) {
    declarations.push(`color:${safeTextColor}`);
  }

  if (safeHighlightColor) {
    declarations.push(`background:${safeHighlightColor}`);
  }

  return declarations.length > 0 ? ` style="${declarations.join(';')}"` : '';
}

function renderPanelValue(value: string, record: ChartRecord, day: ChartDayKey) {
  const dayStyle = getChartCellStyle(record, day);
  const styleAttr = buildInlineStyle(dayStyle.textColor, dayStyle.highlightColor);
  const parts = parsePanelParts(value);

  if (!parts) {
    return `<span class="panel-fallback"${styleAttr}>${escapeHtml(value)}</span>`;
  }

  return `<div class="panel-value"${styleAttr}>
  <span class="panel-side">${parts.left
    .split('')
    .map((digit) => `<span>${escapeHtml(digit)}</span>`)
    .join('')}</span>
  <span class="panel-center">${escapeHtml(parts.center)}</span>
  <span class="panel-side">${parts.right
    .split('')
    .map((digit) => `<span>${escapeHtml(digit)}</span>`)
    .join('')}</span>
</div>`;
}

function renderJodiValue(value: string, record: ChartRecord, day: ChartDayKey) {
  const dayStyle = getChartCellStyle(record, day);
  const styleAttr = buildInlineStyle(dayStyle.textColor, dayStyle.highlightColor);
  return `<span class="jodi-value"${styleAttr}>${escapeHtml(value)}</span>`;
}

function chartRow(record: ChartRecord, chartType: 'jodi' | 'panel', visibleDays: ChartDayKey[]) {
  const cells: string[] = [];

  if (chartType === 'panel') {
    cells.push(`<td class="chart-date">${escapeHtml(formatDisplayDate(record.week_start))}<br/>to<br/>${escapeHtml(formatDisplayDate(record.week_end))}</td>`);
  }

  for (const day of visibleDays) {
    const value = record[day] as string;
    const content = chartType === 'panel' ? renderPanelValue(value, record, day) : renderJodiValue(value, record, day);
    cells.push(`<td class="chart-cell chart-cell-${chartType}">${content}</td>`);
  }

  return `<tr>${cells.join('')}</tr>`;
}

export function renderChartSnapshot(params: {
  market: Market;
  chartType: 'jodi' | 'panel';
  records: ChartRecord[];
  includeAll: boolean;
  pagePath: string;
}) {
  const { market, chartType, records, includeAll, pagePath } = params;
  const titlePrefix = chartType === 'jodi' ? 'JODI' : 'PANEL';
  const filtered = includeAll ? records : records.slice(-300);
  const visibleDays = getVisibleDayKeys(market.show_sunday);
  const headingYear = getChartYearRange(filtered);

  return `<!doctype html>
<html amp lang="en-in">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
<script async src="https://cdn.ampproject.org/v0.js"></script>
<title>${escapeHtml(`${market.name} ${titlePrefix} Chart`)}</title>
<link rel="canonical" href="${escapeHtml(pagePath)}" />
<style amp-custom>
body{background:#fc9;font-family:Helvetica,sans-serif;font-style:italic;font-weight:700;margin:0;padding:6px;text-align:center}
.container{max-width:1320px;margin:0 auto}
.heading{background:#3f51b5;color:#fff;padding:8px;border-radius:8px;margin-bottom:8px}
.meta{border:2px solid #ff182c;border-radius:10px;padding:8px;margin-bottom:8px;background:#ffe4c0}
table{width:100%;border-collapse:collapse;background:#fff6ea}
th,td{border:1px solid #ff0016;padding:4px;font-size:13px;text-align:center;vertical-align:middle}
a.btn{display:inline-block;margin:4px;padding:6px 12px;border:2px solid #2244aa;border-radius:6px;color:#0a2463;text-decoration:none;font-weight:800}
.table-wrap{overflow-x:auto}
.chart-date{min-width:110px;font-size:18px;line-height:1.1;font-style:normal}
.chart-cell-jodi{min-width:92px}
.chart-cell-panel{min-width:132px}
.jodi-value{display:inline-block;padding:2px 8px;font-size:28px;line-height:1.1;color:#111;border-radius:4px}
.panel-value{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:4px 8px;border-radius:4px;min-height:62px}
.panel-side{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:18px;line-height:0.92}
.panel-center{display:inline-block;font-size:22px;line-height:1;color:#111}
.panel-fallback{display:inline-block;padding:2px 6px;border-radius:4px;font-size:22px;line-height:1.1}
@media (max-width:700px){
  .chart-date{font-size:15px;min-width:96px}
  .chart-cell-panel{min-width:110px}
  .panel-value{gap:5px;padding:4px}
  .panel-side{font-size:16px}
  .panel-center,.panel-fallback,.jodi-value{font-size:20px}
}
</style>
</head>
<body>
<div class="container" id="top">
  <h1>${escapeHtml(`${market.name.toUpperCase()} ${titlePrefix} CHART`)}</h1>
  <div class="meta">
    <p><strong>Market:</strong> ${escapeHtml(market.name)}</p>
    <p><strong>Timings:</strong> ${escapeHtml(market.open_time ?? '--')} - ${escapeHtml(market.close_time ?? '--')}</p>
    <p><strong>Open Days:</strong> ${escapeHtml(getOpenDaysLabel(market.show_sunday))}</p>
  </div>
  <a class="btn" href="/">Home</a>
  <a class="btn" href="#bottom">Go to Bottom</a>
  ${chartType === 'panel' ? `<a class="btn" href="?full_chart">View Full Chart</a>` : ''}
  <div class="heading">${escapeHtml(`${market.name.toUpperCase()} ${titlePrefix} RECORD (${headingYear})`)}</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${chartType === 'panel' ? '<th>Date</th>' : ''}${visibleDays
          .map((day) => `<th>${day[0].toUpperCase()}${day.slice(1)}</th>`)
          .join('')}</tr>
      </thead>
      <tbody>
        ${filtered.map((record) => chartRow(record, chartType, visibleDays)).join('\n')}
      </tbody>
    </table>
  </div>
  <div id="bottom"></div>
  <a class="btn" href="#top">Go to Top</a>
</div>
</body>
</html>`;
}
