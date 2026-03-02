import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getActiveMarkets, getLatestResultsByMarket } from '@/lib/page-resolver';
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

  const testId = randomUUID().slice(0, 8);
  const slug = `market-${testId}`;
  const today = new Date().toISOString().slice(0, 10);

  const { data: market, error: marketError } = await supabase
    .from('markets')
    .insert({
      slug,
      name: `Test Market ${testId}`,
      status: 'active',
      sort_order: 99999,
      open_time: '09:00 AM',
      close_time: '10:00 PM',
      has_jodi: true,
      has_panel: true
    })
    .select('*')
    .single();

  if (marketError || !market) {
    throw new Error(`Failed to create test market: ${marketError?.message ?? 'unknown'}`);
  }

  try {
    const { error: resultError } = await supabase.from('market_results').insert({
      market_id: market.id,
      result_date: today,
      open_panna: '128',
      open_ank: '1',
      close_panna: '470',
      close_ank: '1',
      jodi: '11',
      notes: 'test'
    });

    if (resultError) {
      throw new Error(`Failed to create test result: ${resultError.message}`);
    }

    const { error: chartError } = await supabase.from('chart_records').insert({
      market_id: market.id,
      chart_type: 'jodi',
      week_start: today,
      week_end: today,
      mon: '11',
      tue: '**',
      wed: '**',
      thu: '**',
      fri: '**',
      sat: '**',
      source_year_label: today.slice(0, 4)
    });

    if (chartError) {
      throw new Error(`Failed to create test chart row: ${chartError.message}`);
    }

    const markets = await getActiveMarkets();
    const createdMarket = markets.find((row) => row.id === market.id);
    assert(createdMarket, 'Created market not visible in active market list');

    const latestByMarket = await getLatestResultsByMarket([market.id]);
    const latest = latestByMarket.get(market.id);

    assert(latest, 'Latest outcome missing for created market');
    assert.equal(latest.jodi, '11', 'Latest jodi mismatch for created market');

    console.log('PASS: admin-driven flow validated (market + outcome reflected in frontend resolver).');
  } finally {
    await supabase.from('market_results').delete().eq('market_id', market.id);
    await supabase.from('chart_records').delete().eq('market_id', market.id);
    await supabase.from('markets').delete().eq('id', market.id);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
