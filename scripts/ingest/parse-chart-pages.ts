import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { PATHS, SOURCE_BASE_URL, readJson, writeJson } from './common';

type ParsedChartRecord = {
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
};

interface Manifest {
  items: Array<{ url: string; file: string }>;
}

function detectType(url: string): 'jodi' | 'panel' | null {
  if (url.includes('/jodi-chart-record/')) {
    return 'jodi';
  }

  if (url.includes('/panel-chart-record/')) {
    return 'panel';
  }

  return null;
}

function parseDateRange(raw: string): { week_start: string; week_end: string } {
  const compact = raw.replace(/\s+/g, ' ').trim();
  const match = compact.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) {
    return { week_start: '1970-01-01', week_end: '1970-01-06' };
  }

  const [, d1, m1, y1, d2, m2, y2] = match;
  return {
    week_start: `${y1}-${m1}-${d1}`,
    week_end: `${y2}-${m2}-${d2}`
  };
}

async function run() {
  const manifest = await readJson<Manifest>(PATHS.pageManifest);
  const parsed: ParsedChartRecord[] = [];

  for (const item of manifest.items) {
    const chartType = detectType(item.url);
    if (!chartType) {
      continue;
    }

    const html = await fs.readFile(path.join(PATHS.pagesDir, item.file), 'utf8');
    const $ = cheerio.load(html);

    const slug = item.url
      .replace(`${SOURCE_BASE_URL}/${chartType}-chart-record/`, '')
      .replace('.php', '')
      .replace('?full_chart', '');

    const heading = $('h3').first().text().trim();

    const rows = $('table tbody tr')
      .map((_, row) => {
        const cells = $(row)
          .find('td')
          .map((__, cell) =>
            $(cell)
              .text()
              .replace(/\s+/g, ' ')
              .trim()
          )
          .get();

        if (cells.length < 7) {
          return null;
        }

        const dateRange = parseDateRange(cells[0]);

        return {
          ...dateRange,
          mon: cells[1],
          tue: cells[2],
          wed: cells[3],
          thu: cells[4],
          fri: cells[5],
          sat: cells[6],
          source_year_label: dateRange.week_start.slice(0, 4)
        };
      })
      .get()
      .filter(Boolean) as ParsedChartRecord['rows'];

    parsed.push({
      market_slug: slug,
      chart_type: chartType,
      heading,
      rows
    });
  }

  await writeJson(PATHS.parsedCharts, {
    generated_at: new Date().toISOString(),
    count: parsed.length,
    items: parsed
  });

  console.log(`Parsed ${parsed.length} chart pages`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
