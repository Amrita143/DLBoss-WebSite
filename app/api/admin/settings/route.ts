import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';

const upsertSchema = z.object({
  setting_key: z.string().min(1),
  setting_value: z.record(z.unknown())
});

export async function GET() {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase.from('site_settings').select('*').order('setting_key', { ascending: true });

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function PUT(request: Request) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error: upsertError } = await supabase
    .from('site_settings')
    .upsert(parsed.data, { onConflict: 'setting_key' })
    .select('*')
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
