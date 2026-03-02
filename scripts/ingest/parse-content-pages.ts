import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { PATHS, SOURCE_BASE_URL, readJson, writeJson } from './common';

interface Manifest {
  items: Array<{ url: string; file: string }>;
}

function inferPageType(url: string): 'home' | 'chart' | 'content' | 'utility' {
  if (url === `${SOURCE_BASE_URL}/`) {
    return 'home';
  }

  if (url.includes('/jodi-chart-record/') || url.includes('/panel-chart-record/')) {
    return 'chart';
  }

  if (
    url.includes('/about.php') ||
    url.includes('/contact.php') ||
    url.includes('/privacy.php') ||
    url.includes('/tos.php') ||
    url.includes('/ever-green-tricks/')
  ) {
    return 'content';
  }

  return 'utility';
}

function relativePath(url: string): string {
  const raw = url.replace(SOURCE_BASE_URL, '');
  return raw === '' ? '/' : raw;
}

function removeCloudflareScript(html: string): string {
  return html.replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?<\/script>/gi, '');
}

async function run() {
  const manifest = await readJson<Manifest>(PATHS.pageManifest);
  const parsed: Array<Record<string, unknown>> = [];

  for (const item of manifest.items) {
    const html = await fs.readFile(path.join(PATHS.pagesDir, item.file), 'utf8');
    const sanitized = removeCloudflareScript(html);
    const $ = cheerio.load(sanitized);

    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content') ?? null;
    const keywords = $('meta[name="keywords"]').attr('content') ?? null;
    const canonical = $('link[rel="canonical"]').attr('href') ?? null;
    const body = $('body').html() ?? '';

    parsed.push({
      path: relativePath(item.url),
      page_type: inferPageType(item.url),
      title,
      meta_description: description,
      meta_keywords: keywords,
      canonical_url: canonical,
      body_blocks: { html: body },
      raw_html_snapshot: sanitized,
      is_published: true
    });
  }

  await writeJson(PATHS.parsedPages, {
    generated_at: new Date().toISOString(),
    count: parsed.length,
    items: parsed
  });

  console.log(`Parsed ${parsed.length} pages`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
