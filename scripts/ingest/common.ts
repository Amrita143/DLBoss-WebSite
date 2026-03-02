import fs from 'node:fs/promises';
import path from 'node:path';

export const TMP_DIR = path.resolve(process.cwd(), 'scripts/ingest/tmp');
export const SOURCE_BASE_URL = 'https://dpboss.boston';

export const PATHS = {
  sitemap: path.join(TMP_DIR, 'sitemap.xml'),
  urls: path.join(TMP_DIR, 'urls.json'),
  pagesDir: path.join(TMP_DIR, 'pages'),
  pageManifest: path.join(TMP_DIR, 'page-manifest.json'),
  parsedCharts: path.join(TMP_DIR, 'parsed-charts.json'),
  parsedPages: path.join(TMP_DIR, 'parsed-pages.json')
};

export async function ensureTmpDirs() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(PATHS.pagesDir, { recursive: true });
}

export function urlToFileName(url: string): string {
  if (url === `${SOURCE_BASE_URL}/`) {
    return 'root.html';
  }

  const clean = url.replace(`${SOURCE_BASE_URL}/`, '');
  const safe = clean.replaceAll('/', '__').replaceAll('?', '--q--').replaceAll('&', '--and--');
  return `${safe}.html`;
}

export async function writeJson(file: string, value: unknown) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as T;
}
