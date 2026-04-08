import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';
import { normalizeChartCellStyles } from '@/lib/chart-display';

const createSchema = z.object({
  market_id: z.string().uuid(),
  chart_type: z.enum(['jodi', 'panel']),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mon: z.string(),
  tue: z.string(),
  wed: z.string(),
  thu: z.string(),
  fri: z.string(),
  sat: z.string(),
  sun: z.string().optional(),
  cell_styles: z.record(z.unknown()).optional(),
  source_year_label: z.string().min(1)
});

export async function GET(request: Request) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get('page') ?? '1') || 1, 1);
  const pageSizeParam = Number(url.searchParams.get('pageSize') ?? url.searchParams.get('limit') ?? '50') || 50;
  const pageSize = Math.min(Math.max(pageSizeParam, 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const marketId = url.searchParams.get('marketId');
  const chartType = url.searchParams.get('chartType');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('chart_records')
    .select('*', { count: 'exact' })
    .order('week_start', { ascending: false });

  if (marketId) {
    query = query.eq('market_id', marketId);
  }

  if (chartType === 'jodi' || chartType === 'panel') {
    query = query.eq('chart_type', chartType);
  }

  const { data, count, error: queryError } = await query.range(from, to);

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    sun: parsed.data.sun ?? '**',
    cell_styles: normalizeChartCellStyles(parsed.data.cell_styles)
  };

  const supabase = getSupabaseAdmin();
  const { data, error: insertError } = await supabase
    .from('chart_records')
    .upsert(payload, { onConflict: 'market_id,chart_type,week_start' })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'chart.upsert', payload });

  return NextResponse.json({ item: data }, { status: 201 });
}
