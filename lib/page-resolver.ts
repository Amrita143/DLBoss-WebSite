import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { normalizeContentPath } from '@/lib/path';
import type { ChartRecord, Market, MarketResult, PageDoc } from '@/lib/types';

function isNetworkTransportError(message: string): boolean {
  const lowered = message.toLowerCase();
  return lowered.includes('fetch failed') || lowered.includes('network') || lowered.includes('connection');
}

export async function getPublishedPageByPath(pathname: string): Promise<PageDoc | null> {
  const path = normalizeContentPath(pathname);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('path', path)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getPublishedPageByPath(${path}): ${error.message}`);
      return null;
    }
    throw new Error(`Failed to fetch page by path ${path}: ${error.message}`);
  }

  return data as PageDoc | null;
}

export async function getMarketBySlug(slug: string): Promise<Market | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getMarketBySlug(${slug}): ${error.message}`);
      return null;
    }
    throw new Error(`Failed to fetch market ${slug}: ${error.message}`);
  }

  return data as Market | null;
}

export async function getActiveMarkets(): Promise<Market[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getActiveMarkets: ${error.message}`);
      return [];
    }
    throw new Error(`Failed to list active markets: ${error.message}`);
  }

  return (data ?? []) as Market[];
}

export async function getChartRecords(marketId: string, chartType: 'jodi' | 'panel', includeAll = false): Promise<ChartRecord[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('chart_records')
    .select('*')
    .eq('market_id', marketId)
    .eq('chart_type', chartType)
    .order('week_start', { ascending: true });

  if (!includeAll) {
    query = query.limit(300);
  }

  const { data, error } = await query;

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getChartRecords(${marketId},${chartType}): ${error.message}`);
      return [];
    }
    throw new Error(`Failed to fetch chart records for ${marketId}: ${error.message}`);
  }

  return (data ?? []) as ChartRecord[];
}

export async function getMarketResults(marketId: string, limit = 30): Promise<MarketResult[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('market_results')
    .select('*')
    .eq('market_id', marketId)
    .order('result_date', { ascending: false })
    .limit(limit);

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getMarketResults(${marketId}): ${error.message}`);
      return [];
    }
    throw new Error(`Failed to fetch market results for ${marketId}: ${error.message}`);
  }

  return (data ?? []) as MarketResult[];
}

export async function getLatestResultsByMarket(marketIds: string[]): Promise<Map<string, MarketResult>> {
  if (marketIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('market_results')
    .select('*')
    .in('market_id', marketIds)
    .order('result_date', { ascending: false });

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in getLatestResultsByMarket: ${error.message}`);
      return new Map();
    }
    throw new Error(`Failed to fetch latest market results: ${error.message}`);
  }

  const latestByMarket = new Map<string, MarketResult>();
  for (const row of (data ?? []) as MarketResult[]) {
    if (!latestByMarket.has(row.market_id)) {
      latestByMarket.set(row.market_id, row);
    }
  }

  return latestByMarket;
}

export async function listPublishedPaths(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('pages').select('path').eq('is_published', true);

  if (error) {
    if (isNetworkTransportError(error.message)) {
      console.error(`Supabase network error in listPublishedPaths: ${error.message}`);
      return [];
    }
    throw new Error(`Failed to list paths: ${error.message}`);
  }

  return (data ?? []).map((row: { path: string }) => row.path);
}
