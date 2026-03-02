import { createClient } from '@supabase/supabase-js';
import { PATHS, readJson } from './common';
import { loadScriptEnv } from '../load-env';

loadScriptEnv();

interface ParsedCharts {
  items: Array<{
    market_slug: string;
    chart_type: 'jodi' | 'panel';
    heading: string;
    rows: Array<{
      week_start: string;
      week_end: string;
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      source_year_label: string;
    }>;
  }>;
}

interface ParsedPages {
  items: Array<{
    path: string;
    page_type: 'home' | 'chart' | 'content' | 'utility';
    title: string;
    meta_description: string | null;
    meta_keywords: string | null;
    canonical_url: string | null;
    body_blocks: Record<string, unknown>;
    raw_html_snapshot: string;
    is_published: boolean;
  }>;
}

type ChartRow = {
  week_start: string;
  week_end: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  source_year_label: string;
  market_id: string;
  chart_type: 'jodi' | 'panel';
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function readBooleanEnv(name: string): boolean {
  return (process.env[name] ?? '').toLowerCase() === 'true';
}

function dedupeChartRows(rows: ChartRow[]): { rows: ChartRow[]; duplicateCount: number } {
  const unique = new Map<string, ChartRow>();
  let duplicateCount = 0;

  for (const row of rows) {
    const key = `${row.market_id}|${row.chart_type}|${row.week_start}`;
    if (unique.has(key)) {
      duplicateCount += 1;
    }
    unique.set(key, row);
  }

  return { rows: Array.from(unique.values()), duplicateCount };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function isStatementTimeoutError(message: string): boolean {
  return message.toLowerCase().includes('statement timeout') || message.toLowerCase().includes('canceling statement');
}

async function run() {
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const parsedCharts = await readJson<ParsedCharts>(PATHS.parsedCharts);
  const seedScrapedPages = readBooleanEnv('SEED_SCRAPED_PAGES');
  const parsedPages = seedScrapedPages ? await readJson<ParsedPages>(PATHS.parsedPages) : { items: [] };

  const marketMap = new Map<string, string>();

  for (const item of parsedCharts.items) {
    const { data, error } = await supabase
      .from('markets')
      .upsert(
        {
          slug: item.market_slug,
          name: item.market_slug.replaceAll('-', ' ').replace(/\b\w/g, (x) => x.toUpperCase()),
          status: 'active',
          has_jodi: item.chart_type === 'jodi' ? true : false,
          has_panel: item.chart_type === 'panel' ? true : false
        },
        { onConflict: 'slug' }
      )
      .select('id,slug')
      .single();

    if (error) {
      throw new Error(`Failed upserting market ${item.market_slug}: ${error.message}`);
    }

    marketMap.set(data.slug, data.id);
  }

  for (const item of parsedCharts.items) {
    const marketId = marketMap.get(item.market_slug);
    if (!marketId) {
      continue;
    }

    const rawRows = item.rows.map((row) => ({ ...row, market_id: marketId, chart_type: item.chart_type }));
    const { rows, duplicateCount } = dedupeChartRows(rawRows);

    if (rows.length === 0) {
      continue;
    }

    const { error } = await supabase.from('chart_records').upsert(rows, {
      onConflict: 'market_id,chart_type,week_start'
    });

    if (error) {
      throw new Error(`Failed upserting chart rows for ${item.market_slug}: ${error.message}`);
    }

    if (duplicateCount > 0) {
      console.log(
        `Deduped ${duplicateCount} duplicate chart rows for ${item.market_slug} (${item.chart_type}) before upsert`
      );
    }
  }

  let processedPages = 0;
  if (seedScrapedPages) {
    const pageChunks = chunkArray(parsedPages.items, 5);
    for (const chunk of pageChunks) {
      const { error: chunkError } = await supabase.from('pages').upsert(chunk, { onConflict: 'path' });

      if (!chunkError) {
        processedPages += chunk.length;
        continue;
      }

      if (!isStatementTimeoutError(chunkError.message)) {
        throw new Error(`Failed upserting pages chunk at ${processedPages}: ${chunkError.message}`);
      }

      // Fallback path for very large snapshots: retry each page individually.
      for (const page of chunk) {
        const { error: pageError } = await supabase.from('pages').upsert(page, { onConflict: 'path' });
        if (pageError) {
          throw new Error(`Failed upserting page ${page.path}: ${pageError.message}`);
        }
        processedPages += 1;
      }
    }
  }

  const { error: settingError } = await supabase.from('site_settings').upsert(
    {
      setting_key: 'homepage_rotating_phrases',
      setting_value: {
        phrases: ['Fix Ank', 'Kalyan Fix', 'Milan Fix', 'Fix open', 'Fix close', 'Fix jodi']
      }
    },
    { onConflict: 'setting_key' }
  );

  if (settingError) {
    throw new Error(`Failed upserting default settings: ${settingError.message}`);
  }

  console.log(
    `Seed complete: markets=${marketMap.size}, charts=${parsedCharts.items.length}, pages=${processedPages} (seed pages=${seedScrapedPages})`
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
