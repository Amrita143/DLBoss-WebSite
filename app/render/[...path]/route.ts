import { NextRequest, NextResponse } from 'next/server';
import { getChartRecords, getMarketBySlug } from '@/lib/page-resolver';
import { renderChartSnapshot } from '@/lib/render-fallback';
import { phpPathFromSegments } from '@/lib/path';

export const dynamic = 'force-dynamic';

function parseChartPath(path: string): { chartType: 'jodi' | 'panel'; slug: string } | null {
  const jodi = path.match(/^\/jodi-chart-record\/([a-z0-9-]+)\.php$/i);
  if (jodi) {
    return { chartType: 'jodi', slug: jodi[1] };
  }

  const panel = path.match(/^\/panel-chart-record\/([a-z0-9-]+)\.php$/i);
  if (panel) {
    return { chartType: 'panel', slug: panel[1] };
  }

  return null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;
  const requestedPath = phpPathFromSegments(segments);

  const chartMeta = parseChartPath(requestedPath);
  if (chartMeta) {
    const market = await getMarketBySlug(chartMeta.slug);
    if (!market) {
      return new NextResponse('Not found', { status: 404 });
    }

    const fullChart = request.nextUrl.searchParams.has('full_chart');
    const records = await getChartRecords(market.id, chartMeta.chartType, fullChart);
    const html = renderChartSnapshot({
      market,
      pagePath: request.nextUrl.href,
      chartType: chartMeta.chartType,
      records,
      includeAll: fullChart
    });

    return new NextResponse(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    });
  }
  return new NextResponse('This route is no longer used. Use / for live admin-driven data.', { status: 404 });
}
