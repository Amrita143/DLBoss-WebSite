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
import { absoluteUrl } from '@/lib/site';

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
  <span class="panel-side panel-side-left">${parts.left
    .split('')
    .map((digit) => `<span>${escapeHtml(digit)}</span>`)
    .join('')}</span>
  <span class="panel-center">${escapeHtml(parts.center)}</span>
  <span class="panel-side panel-side-right">${parts.right
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
  const pageTitle = `${market.name} ${titlePrefix} Chart`;
  const description = `Check the ${market.name} ${titlePrefix.toLowerCase()} chart on DLBOSS.COM. Open days: ${getOpenDaysLabel(
    market.show_sunday
  )}. Market timing: ${market.open_time ?? '--'} - ${market.close_time ?? '--'}.`;
  const previewImage = absoluteUrl('/icon.jpg');

  return `<!doctype html>
<html amp lang="en-in">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
<script async src="https://cdn.ampproject.org/v0.js"></script>
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
<link rel="canonical" href="${escapeHtml(pagePath)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="DLBOSS" />
<meta property="og:title" content="${escapeHtml(pageTitle)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(pagePath)}" />
<meta property="og:image" content="${escapeHtml(previewImage)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(previewImage)}" />
<style amp-custom>
body{background:#fc9;font-family:Helvetica,sans-serif;font-style:italic;font-weight:700;margin:0;padding:6px;text-align:center}
.container{max-width:1320px;margin:0 auto}
.heading{background:#3f51b5;color:#fff;padding:8px;border-radius:8px;margin-bottom:8px}
.meta{border:2px solid #ff182c;border-radius:10px;padding:8px;margin-bottom:8px;background:#ffe4c0}
table{width:100%;border-collapse:collapse;table-layout:fixed;background:#f4c79b}
th,td{border:1px solid #ff0016;padding:4px 2px;font-size:clamp(7px,1.55vw,13px);text-align:center;vertical-align:middle;background:#f4c79b}
th{background:#f7bf14;color:#111;font-style:normal;font-weight:900}
a.btn{display:inline-block;margin:4px;padding:6px 12px;border:2px solid #2244aa;border-radius:6px;color:#0a2463;text-decoration:none;font-weight:800}
.table-wrap{overflow:visible}
.chart-date{width:clamp(40px,13vw,120px);font-size:clamp(7px,2vw,18px);line-height:1.05;font-style:normal;font-weight:900;background:#f4c79b}
.chart-cell-jodi,.chart-cell-panel{width:auto}
.jodi-value{display:inline-block;padding:2px 4px;font-size:clamp(11px,3vw,28px);line-height:1.05;color:#111;border-radius:4px;font-style:normal}
.panel-value{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;column-gap:clamp(2px,0.75vw,8px);padding:2px 2px;border-radius:4px;min-height:clamp(34px,6.2vw,72px);width:100%;max-width:100%;box-sizing:border-box;color:inherit;font-style:normal}
.panel-side{display:grid;grid-template-rows:repeat(3,1fr);font-size:clamp(8px,2.55vw,18px);line-height:0.9;color:inherit;font-weight:800}
.panel-side-left{justify-items:start;text-align:left;padding-left:1px}
.panel-side-right{justify-items:end;text-align:right;padding-right:1px}
.panel-center{display:inline-block;font-size:clamp(10px,3.05vw,30px);line-height:1;color:inherit;font-weight:900;justify-self:center}
.panel-fallback{display:inline-block;padding:2px 4px;border-radius:4px;font-size:clamp(10px,3.2vw,22px);line-height:1.05;color:inherit;font-style:normal}
@media (max-width:700px){
  body{padding:3px}
  .container{max-width:none}
  .meta{padding:6px}
  a.btn{margin:3px;padding:5px 8px;font-size:13px}
  th,td{padding:3px 1px;font-size:clamp(6px,1.85vw,11px)}
  .chart-date{width:clamp(34px,16vw,78px);font-size:clamp(6px,1.95vw,11px)}
  .jodi-value{padding:1px 2px;font-size:clamp(8px,3vw,16px)}
  .panel-value{column-gap:clamp(1px,0.55vw,4px);padding:1px 2px;min-height:clamp(26px,9vw,44px)}
  .panel-side{font-size:clamp(7px,2.5vw,12px);line-height:0.94}
  .panel-center{font-size:clamp(8px,2.55vw,14px)}
  .panel-fallback{font-size:clamp(8px,2.8vw,14px)}
}
@media (max-width:420px){
  body{padding:2px}
  .heading{padding:7px 4px}
  .meta{padding:5px}
  a.btn{margin:2px;padding:4px 6px;font-size:12px}
  th,td{padding:2px 1px;font-size:clamp(5px,1.7vw,8px)}
  .chart-date{width:clamp(30px,18vw,64px);font-size:clamp(5px,1.7vw,8px)}
  .jodi-value{font-size:clamp(7px,2.7vw,13px)}
  .panel-side{font-size:clamp(6px,2.35vw,10px);line-height:0.96}
  .panel-center{font-size:clamp(7px,2.55vw,11px)}
  .panel-fallback{font-size:clamp(7px,2.5vw,12px)}
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
