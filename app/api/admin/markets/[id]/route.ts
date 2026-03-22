import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';
import { sanitizeHexColor } from '@/lib/chart-display';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sort_order: z.number().int().optional(),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  has_jodi: z.boolean().optional(),
  has_panel: z.boolean().optional(),
  show_sunday: z.boolean().optional(),
  is_highlighted: z.boolean().optional(),
  highlight_color: z.string().optional()
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
    ...(parsed.data.highlight_color !== undefined
      ? { highlight_color: sanitizeHexColor(parsed.data.highlight_color) ?? '#fff200' }
      : {})
  };

  const supabase = getSupabaseAdmin();
  const { data, error: updateError } = await supabase.from('markets').update(payload).eq('id', id).select('*').single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'market.update', payload: { id, ...payload } });

  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase.from('markets').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'market.delete', payload: { id } });

  return NextResponse.json({ ok: true });
}
