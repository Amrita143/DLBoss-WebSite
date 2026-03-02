import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureAdmin } from '@/lib/admin-api';

const schema = z.object({
  is_published: z.boolean()
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await ensureAdmin();
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error: updateError } = await supabase
    .from('pages')
    .update({ is_published: parsed.data.is_published })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase
    .from('admin_audit_log')
    .insert({ action: parsed.data.is_published ? 'page.publish' : 'page.unpublish', payload: { id } });

  return NextResponse.json({ item: data });
}
