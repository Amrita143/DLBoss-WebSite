import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function createAdminSession(email: string, password: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
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

  return {
    userId: user.id,
    email: user.email ?? 'unknown',
    role: 'owner' as const
  };
}
