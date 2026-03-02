import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';

const targets = [
  { url: 'https://dpboss.boston/', output: 'app/styles/home.css' },
  { url: 'https://dpboss.boston/jodi-chart-record/kalyan.php', output: 'app/styles/chart.css' },
  { url: 'https://dpboss.boston/about.php', output: 'app/styles/content.css' }
];

async function fetchStyles(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed fetching ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return $('style')
    .map((_, style) => $(style).text())
    .get()
    .filter(Boolean)
    .join('\n\n');
}

async function run() {
  for (const target of targets) {
    const css = await fetchStyles(target.url);
    const outputPath = path.resolve(process.cwd(), target.output);
    const banner = `/* Extracted from ${target.url} on ${new Date().toISOString()} */\n\n`;
    await fs.writeFile(outputPath, `${banner}${css}\n`, 'utf8');
    console.log(`Wrote ${target.output}`);
  }

  const basePath = path.resolve(process.cwd(), 'app/styles/base.css');
  const base = `/* Global base rules for DPBOSS clone */\nhtml{overflow-x:hidden;scroll-behavior:smooth;}\nbody{background-color:#fc9;text-align:center;padding:3px 10px;margin:0;scroll-behavior:smooth;font-style:italic;font-family:Helvetica,sans-serif;font-weight:700;}\n*{margin:0;padding:0;box-sizing:border-box;}\na,a:hover{text-decoration:none;}\n`;
  await fs.writeFile(basePath, base, 'utf8');
  console.log('Wrote app/styles/base.css');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
