import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureAdmin } from '@/lib/admin-api';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidLoginId, loginIdToAuthEmail, normalizeLoginId } from '@/lib/admin-users';

const createSchema = z.object({
  login_id: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(['admin', 'superadmin']).default('admin')
});

function toFriendlyError(message: string) {
  if (message.toLowerCase().includes('login_id')) {
    return `${message}. Run migration 0003_superadmin_admins.sql first.`;
  }
  return message;
}

export async function GET() {
  const { error } = await ensureAdmin({ roles: ['superadmin'] });
  if (error) {
    return error;
  }

  const supabase = getSupabaseAdmin();
  const { data, error: queryError } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, login_id, email, role, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (queryError) {
    return NextResponse.json({ error: toFriendlyError(queryError.message) }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { session, error } = await ensureAdmin({ roles: ['superadmin'] });
  if (error) {
    return error;
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const loginId = normalizeLoginId(parsed.data.login_id);
  if (!isValidLoginId(loginId)) {
    return NextResponse.json(
      { error: 'Invalid Admin ID. Use lowercase letters, numbers, dot, underscore, or hyphen.' },
      { status: 400 }
    );
  }

  const email = loginIdToAuthEmail(loginId);
  const supabase = getSupabaseAdmin();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true
  });

  if (createError) {
    const message = createError.message.toLowerCase().includes('already')
      ? 'Admin ID already exists'
      : createError.message;
    const status = createError.message.toLowerCase().includes('already') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const authUserId = created.user?.id;
  if (!authUserId) {
    return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from('admin_users')
    .insert({ auth_user_id: authUserId, login_id: loginId, email, role: parsed.data.role })
    .select('id, auth_user_id, login_id, email, role, created_at, updated_at')
    .single();

  if (insertError) {
    await supabase.auth.admin.deleteUser(authUserId);
    return NextResponse.json({ error: toFriendlyError(insertError.message) }, { status: 500 });
  }

  await supabase
    .from('admin_audit_log')
    .insert({ actor_auth_user_id: session.userId, action: 'admin.create', payload: { login_id: loginId, role: parsed.data.role } });

  return NextResponse.json({ item: data }, { status: 201 });
}
