import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/lib/admin-api';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function toFriendlyError(message: string) {
  if (message.toLowerCase().includes('login_id')) {
    return `${message}. Run migration 0003_superadmin_admins.sql first.`;
  }
  return message;
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await ensureAdmin({ roles: ['superadmin'] });
  if (error) {
    return error;
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: target, error: targetError } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, login_id, role')
    .eq('id', id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: toFriendlyError(targetError.message) }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  if (target.auth_user_id === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own superadmin account' }, { status: 400 });
  }

  const { error: deleteRowError } = await supabase.from('admin_users').delete().eq('id', id);
  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(target.auth_user_id as string);
  if (deleteAuthError) {
    return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });
  }

  await supabase.from('admin_audit_log').insert({
    actor_auth_user_id: session.userId,
    action: 'admin.delete',
    payload: { id, login_id: target.login_id, role: target.role }
  });

  return NextResponse.json({ ok: true });
}
