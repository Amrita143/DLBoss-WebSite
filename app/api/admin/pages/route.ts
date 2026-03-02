import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';

const createSchema = z.object({
  path: z.string().regex(/^\/.+/),
  page_type: z.enum(['home', 'chart', 'content', 'utility']),
  title: z.string().min(1),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  canonical_url: z.string().url().optional(),
  body_blocks: z.record(z.unknown()).optional(),
  raw_html_snapshot: z.string().optional()
});

export async function GET(request: Request) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '100');

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase.from('pages').select('*').order('path', { ascending: true }).limit(Math.min(limit, 2000));

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

  const supabase = getSupabaseAdmin();

  const payload = {
    ...parsed.data,
    is_published: false,
    canonical_url: parsed.data.canonical_url ?? null,
    meta_description: parsed.data.meta_description ?? null,
    meta_keywords: parsed.data.meta_keywords ?? null,
    body_blocks: parsed.data.body_blocks ?? {},
    raw_html_snapshot: parsed.data.raw_html_snapshot ?? null
  };

  const { data, error: insertError } = await supabase.from('pages').insert(payload).select('*').single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({ action: 'page.create', payload: { path: payload.path } });

  return NextResponse.json({ item: data }, { status: 201 });
}
