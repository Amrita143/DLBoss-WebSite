import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';

const baseSchema = z.object({
  market_id: z.string().uuid(),
  result_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  open_panna: z.string().optional().nullable(),
  open_ank: z.string().optional().nullable(),
  close_panna: z.string().optional().nullable(),
  close_ank: z.string().optional().nullable(),
  jodi: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

function normalizeBody(parsed: z.infer<typeof baseSchema>) {
  const openAnk = parsed.open_ank?.trim() ?? null;
  const closeAnk = parsed.close_ank?.trim() ?? null;
  const computedJodi = openAnk && closeAnk ? `${openAnk}${closeAnk}` : null;

  return {
    ...parsed,
    open_panna: parsed.open_panna?.trim() || null,
    open_ank: openAnk,
    close_panna: parsed.close_panna?.trim() || null,
    close_ank: closeAnk,
    jodi: parsed.jodi?.trim() || computedJodi,
    notes: parsed.notes?.trim() || null
  };
}

export async function GET(request: Request) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '150');

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase
    .from('market_results')
    .select('*')
    .order('result_date', { ascending: false })
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

  const parsed = baseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const payload = normalizeBody(parsed.data);

  const supabase = getSupabaseAdmin();
  const { data, error: upsertError } = await supabase
    .from('market_results')
    .upsert(payload, { onConflict: 'market_id,result_date' })
    .select('*')
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'result.upsert', payload });

  return NextResponse.json({ item: data }, { status: 201 });
}
