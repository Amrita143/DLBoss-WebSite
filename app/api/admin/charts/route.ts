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
  const limit = Number(url.searchParams.get('limit') ?? '100');

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase
    .from('chart_records')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(Math.min(limit, 1000));

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
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
  const { data, error: insertError } = await supabase.from('chart_records').insert(payload).select('*').single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'chart.create', payload });

  return NextResponse.json({ item: data }, { status: 201 });
}
