import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';
import { normalizeChartCellStyles } from '@/lib/chart-display';

const updateSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mon: z.string().optional(),
  tue: z.string().optional(),
  wed: z.string().optional(),
  thu: z.string().optional(),
  fri: z.string().optional(),
  sat: z.string().optional(),
  sun: z.string().optional(),
  cell_styles: z.record(z.unknown()).optional(),
  source_year_label: z.string().optional()
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    ...(parsed.data.cell_styles !== undefined ? { cell_styles: normalizeChartCellStyles(parsed.data.cell_styles) } : {})
  };

  const supabase = getSupabaseAdmin();
  const { data, error: updateError } = await supabase.from('chart_records').update(payload).eq('id', id).select('*').single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'chart.update', payload: { id, ...payload } });

  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase.from('chart_records').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'chart.delete', payload: { id } });

  return NextResponse.json({ ok: true });
}
