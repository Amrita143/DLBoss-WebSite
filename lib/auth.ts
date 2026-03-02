import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { AdminRole, AdminSession } from '@/lib/types';
import { normalizeLoginId } from '@/lib/admin-users';

interface SessionResult {
  ok: boolean;
  error?: string;
}

function normalizeIdentifier(value: string) {
  return normalizeLoginId(value);
}

async function getAdminEmailForIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);

  if (normalized.includes('@')) {
    return normalized;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_users')
    .select('email')
    .eq('login_id', normalized)
    .maybeSingle();

  if (error || !data?.email) {
    return null;
  }

  return data.email as string;
}

async function readAdminSessionProfile(userId: string): Promise<Pick<AdminSession, 'loginId' | 'email' | 'role'> | null> {
  const supabase = await getSupabaseServerClient();
  const primaryQuery = await supabase
    .from('admin_users')
    .select('login_id, email, role')
    .eq('auth_user_id', userId)
    .maybeSingle();

  let data = primaryQuery.data as { login_id?: string; email?: string; role?: string } | null;
  let error = primaryQuery.error;

  if (error?.message.toLowerCase().includes('login_id')) {
    const fallbackQuery = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    data = fallbackQuery.data as { email?: string; role?: string } | null;
    error = fallbackQuery.error;
  }

  if (error || !data || !data.email) {
    return null;
  }

  const rawRole = String(data.role ?? '').toLowerCase();
  const role = rawRole === 'owner' ? 'superadmin' : (rawRole as AdminRole);
  if (role !== 'superadmin' && role !== 'admin') {
    return null;
  }

  return {
    loginId: (data.login_id || data.email) as string,
    email: data.email as string,
    role
  };
}

export async function createAdminSession(identifier: string, password: string): Promise<SessionResult> {
  const email = await getAdminEmailForIdentifier(identifier);
  if (!email) {
    return { ok: false, error: 'Invalid admin ID or password' };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: 'Invalid admin ID or password' };
  }

  const profile = await readAdminSessionProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: 'This account is not allowed to access admin panel' };
  }

  return { ok: true };
}

export async function clearAdminSession() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function requireAdminSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await readAdminSessionProfile(user.id);
  if (!profile) {
    return null;
  }

  return {
    userId: user.id,
    loginId: profile.loginId,
    email: profile.email,
    role: profile.role
  };
}
