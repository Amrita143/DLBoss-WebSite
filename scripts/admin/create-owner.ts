import { createClient } from '@supabase/supabase-js';
import { loadScriptEnv } from '../load-env';

loadScriptEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function run() {
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const email = requireEnv('ADMIN_EMAIL');
  const password = requireEnv('ADMIN_PASSWORD');

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  const authUserId = created.user?.id;

  if (createError && !createError.message.toLowerCase().includes('already registered')) {
    throw new Error(createError.message);
  }

  if (!authUserId) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(listError.message);
    }

    const existing = users.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      throw new Error('Could not resolve auth user id for owner');
    }

    const { error: upsertError } = await supabase.from('admin_users').upsert(
      {
        auth_user_id: existing.id,
        email,
        role: 'owner'
      },
      { onConflict: 'auth_user_id' }
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    console.log(`Owner ensured for ${email}`);
    return;
  }

  const { error: upsertError } = await supabase.from('admin_users').upsert(
    {
      auth_user_id: authUserId,
      email,
      role: 'owner'
    },
    { onConflict: 'auth_user_id' }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  console.log(`Owner created for ${email}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
