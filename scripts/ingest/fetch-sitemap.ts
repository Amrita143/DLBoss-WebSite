import fs from 'node:fs/promises';
import { PATHS, SOURCE_BASE_URL, ensureTmpDirs, writeJson } from './common';

async function run() {
  await ensureTmpDirs();

  const response = await fetch(`${SOURCE_BASE_URL}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }

  const sitemap = await response.text();
  await fs.writeFile(PATHS.sitemap, sitemap, 'utf8');

  const urls = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1]).filter(Boolean);

  await writeJson(PATHS.urls, {
    generated_at: new Date().toISOString(),
    count: urls.length,
    urls
  });

  console.log(`Fetched sitemap with ${urls.length} URLs`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
