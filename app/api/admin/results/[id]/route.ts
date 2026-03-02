import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';

const updateSchema = z.object({
  result_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  open_panna: z.string().optional().nullable(),
  open_ank: z.string().optional().nullable(),
  close_panna: z.string().optional().nullable(),
  close_ank: z.string().optional().nullable(),
  jodi: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

function normalize(body: z.infer<typeof updateSchema>) {
  const openAnk = body.open_ank?.trim();
  const closeAnk = body.close_ank?.trim();

  const normalized = {
    ...body,
    open_panna: body.open_panna === undefined ? undefined : body.open_panna?.trim() || null,
    open_ank: body.open_ank === undefined ? undefined : openAnk || null,
    close_panna: body.close_panna === undefined ? undefined : body.close_panna?.trim() || null,
    close_ank: body.close_ank === undefined ? undefined : closeAnk || null,
    notes: body.notes === undefined ? undefined : body.notes?.trim() || null
  } as Record<string, string | null | undefined>;

  if (body.jodi !== undefined) {
    normalized.jodi = body.jodi?.trim() || null;
  } else if (openAnk && closeAnk) {
    normalized.jodi = `${openAnk}${closeAnk}`;
  }

  return normalized;
}

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

  const payload = normalize(parsed.data);
  const supabase = getSupabaseAdmin();

  const { data, error: updateError } = await supabase.from('market_results').update(payload).eq('id', id).select('*').single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'result.update', payload: { id, ...payload } });

  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase.from('market_results').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'result.delete', payload: { id } });

  return NextResponse.json({ ok: true });
}
