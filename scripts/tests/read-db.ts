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
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const publicClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const [{ count: publishedPagesCount, error: publicError }, { count: marketCount, error: marketError }, { count: resultCount, error: resultError }, { data: sampleMarkets, error: sampleMarketsError }, { data: sampleResults, error: sampleResultsError }, { data: adminUsers, error: adminUsersError }] =
    await Promise.all([
      publicClient.from('pages').select('*', { count: 'exact', head: true }).eq('is_published', true),
      adminClient.from('markets').select('*', { count: 'exact', head: true }),
      adminClient.from('market_results').select('*', { count: 'exact', head: true }),
      adminClient.from('markets').select('name, slug, status').order('sort_order', { ascending: true }).limit(5),
      adminClient
        .from('market_results')
        .select('result_date, jodi, market_id')
        .order('result_date', { ascending: false })
        .limit(5),
      adminClient.from('admin_users').select('login_id, role').order('created_at', { ascending: true }).limit(5)
    ]);

  const errors = [publicError, marketError, resultError, sampleMarketsError, sampleResultsError, adminUsersError].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join('; '));
  }

  console.log(
    JSON.stringify(
      {
        connected: true,
        public: {
          publishedPagesCount: publishedPagesCount ?? 0
        },
        admin: {
          marketCount: marketCount ?? 0,
          resultCount: resultCount ?? 0,
          sampleMarkets: sampleMarkets ?? [],
          sampleResults: sampleResults ?? [],
          adminUsers: adminUsers ?? []
        }
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
