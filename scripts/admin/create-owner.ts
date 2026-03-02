import { createClient } from '@supabase/supabase-js';
import { loadScriptEnv } from '../load-env';
import { isValidLoginId, loginIdToAuthEmail, normalizeLoginId } from '../../lib/admin-users';

loadScriptEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function toFriendlyError(message: string) {
  if (message.toLowerCase().includes('login_id')) {
    return `${message}. Run migration supabase/migrations/0003_superadmin_admins.sql first.`;
  }
  return message;
}

async function run() {
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const loginId = normalizeLoginId(process.env.SUPERADMIN_LOGIN_ID ?? 'developerdlboss.com');
  if (!isValidLoginId(loginId)) {
    throw new Error(`Invalid SUPERADMIN_LOGIN_ID: ${loginId}`);
  }

  const email = loginIdToAuthEmail(loginId);
  const password = process.env.SUPERADMIN_PASSWORD ?? 'AmritSuperAdmin';

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  const authUserId = created.user?.id;

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(createError.message);
  }

  if (!authUserId) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(listError.message);
    }

    const existing = users.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      throw new Error('Could not resolve auth user id for superadmin');
    }

    const { error: upsertError } = await supabase.from('admin_users').upsert(
      {
        auth_user_id: existing.id,
        login_id: loginId,
        email,
        role: 'superadmin'
      },
      { onConflict: 'auth_user_id' }
    );

    if (upsertError) {
      throw new Error(toFriendlyError(upsertError.message));
    }

    console.log(`Superadmin ensured for login ID "${loginId}"`);
    return;
  }

  const { error: upsertError } = await supabase.from('admin_users').upsert(
    {
      auth_user_id: authUserId,
      login_id: loginId,
      email,
      role: 'superadmin'
    },
    { onConflict: 'auth_user_id' }
  );

  if (upsertError) {
    throw new Error(toFriendlyError(upsertError.message));
  }

  console.log(`Superadmin created for login ID "${loginId}"`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
