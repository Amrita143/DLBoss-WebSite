import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS, ensureTmpDirs, readJson, urlToFileName, writeJson } from './common';

interface UrlPayload {
  urls: string[];
}

interface PageManifestItem {
  url: string;
  file: string;
  status: number;
  fetched_at: string;
}

async function run() {
  await ensureTmpDirs();

  const payload = await readJson<UrlPayload>(PATHS.urls);
  const items: PageManifestItem[] = [];

  for (const url of payload.urls) {
    const response = await fetch(url);
    const html = await response.text();
    const file = urlToFileName(url);
    const fullPath = path.join(PATHS.pagesDir, file);

    await fs.writeFile(fullPath, html, 'utf8');

    items.push({
      url,
      file,
      status: response.status,
      fetched_at: new Date().toISOString()
    });

    process.stdout.write(`Fetched ${url}\n`);
  }

  await writeJson(PATHS.pageManifest, {
    generated_at: new Date().toISOString(),
    count: items.length,
    items
  });

  console.log(`Saved ${items.length} pages`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
