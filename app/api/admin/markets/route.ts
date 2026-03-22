import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';
import { sanitizeHexColor } from '@/lib/chart-display';

const createSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  sort_order: z.number().int().default(999),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  has_jodi: z.boolean().default(true),
  has_panel: z.boolean().default(true),
  show_sunday: z.boolean().default(false),
  is_highlighted: z.boolean().default(false),
  highlight_color: z.string().optional()
});

export async function GET() {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase.from('markets').select('*').order('sort_order', { ascending: true });

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

  const highlightColor = sanitizeHexColor(parsed.data.highlight_color) ?? '#fff200';

  const supabase = getSupabaseAdmin();
  const { data, error: insertError } = await supabase
    .from('markets')
    .insert({
      ...parsed.data,
      open_time: parsed.data.open_time ?? '',
      close_time: parsed.data.close_time ?? '',
      highlight_color: highlightColor,
      status: 'active'
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'market.create', payload: parsed.data });

  return NextResponse.json({ item: data }, { status: 201 });
}
