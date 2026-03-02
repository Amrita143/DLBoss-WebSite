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

  await supabase.from('market_results').delete().not('id', 'is', null);
  await supabase.from('chart_records').delete().not('id', 'is', null);
  await supabase.from('pages').delete().not('id', 'is', null);
  await supabase.from('markets').delete().not('id', 'is', null);

  await supabase.from('admin_audit_log').insert({
    action: 'system.reset_admin_data',
    payload: { at: new Date().toISOString() }
  });

  console.log('Reset complete: removed markets, outcomes, chart records, and pages.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
