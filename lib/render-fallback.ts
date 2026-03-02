import type { ChartRecord, Market } from '@/lib/types';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function chartRow(record: ChartRecord) {
  return `<tr>
<td>${escapeHtml(record.week_start)}<br/>to<br/>${escapeHtml(record.week_end)}</td>
<td>${escapeHtml(record.mon)}</td>
<td>${escapeHtml(record.tue)}</td>
<td>${escapeHtml(record.wed)}</td>
<td>${escapeHtml(record.thu)}</td>
<td>${escapeHtml(record.fri)}</td>
<td>${escapeHtml(record.sat)}</td>
</tr>`;
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

  const headingYear = filtered.length > 0 ? `${filtered[0].source_year_label} - ${filtered[filtered.length - 1].source_year_label}` : 'No Data';

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
.container{max-width:1200px;margin:0 auto}
.heading{background:#3f51b5;color:#fff;padding:8px;border-radius:8px;margin-bottom:8px}
.meta{border:2px solid #ff182c;border-radius:10px;padding:8px;margin-bottom:8px;background:#ffe4c0}
table{width:100%;border-collapse:collapse;background:#fff6ea}
th,td{border:1px solid #ff0016;padding:4px;font-size:13px;text-align:center}
a.btn{display:inline-block;margin:4px;padding:6px 12px;border:2px solid #2244aa;border-radius:6px;color:#0a2463;text-decoration:none;font-weight:800}
</style>
</head>
<body>
<div class="container">
  <h1>${escapeHtml(`${market.name.toUpperCase()} ${titlePrefix} CHART`)}</h1>
  <div class="meta">
    <p><strong>Market:</strong> ${escapeHtml(market.name)}</p>
    <p><strong>Timings:</strong> ${escapeHtml(market.open_time ?? '--')} - ${escapeHtml(market.close_time ?? '--')}</p>
  </div>
  <a class="btn" href="/">Home</a>
  <a class="btn" href="#bottom">Go to Bottom</a>
  ${chartType === 'panel' ? `<a class="btn" href="?full_chart">View Full Chart</a>` : ''}
  <div class="heading">${escapeHtml(`${market.name.toUpperCase()} ${titlePrefix} RECORD (${headingYear})`)}</div>
  <table>
    <thead>
      <tr><th>Date</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr>
    </thead>
    <tbody>
      ${filtered.map(chartRow).join('\n')}
    </tbody>
  </table>
  <div id="bottom"></div>
  <a class="btn" href="#top">Go to Top</a>
</div>
</body>
</html>`;
}
