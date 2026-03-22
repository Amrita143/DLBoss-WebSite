import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

export type GeneralInfoSections = {
  skyBlocks: string[];
  faqBlocks: string[];
  stoneBlocks: string[];
  disclaimerHtml: string;
  footerBlocks: string[];
  poweredHtml: string;
};

const FALLBACK_HTML_PATH = path.join(process.cwd(), 'data', 'dpboss-home-source.html');
const FOOTER_NON_LINK_LABELS = new Set(['about us', 'contact us', 'privacy & policy', 'term and conditions', 'result api']);

function rebrandHtml(html: string): string {
  return html
    .replace(/dpboss\.boston/gi, 'dlboss.com')
    .replace(/dpboss\.net/gi, 'dlboss.com')
    .replace(/dpboss\.in/gi, 'dlboss.com')
    .replace(/DPBOSS/gi, 'DLBOSS')
    .replace(/DP Boss/gi, 'DL Boss')
    .replace(/dp boss/gi, 'dl boss')
    .replace(/dpboss/gi, 'dlboss');
}

function removeSelectedFooterLinks(html: string): string {
  const $ = load(`<div id="root">${html}</div>`);

  $('#root a').each((_, element) => {
    const label = $(element)
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (!FOOTER_NON_LINK_LABELS.has(label)) {
      return;
    }

    $(element).replaceWith(`<span>${$(element).html() ?? $(element).text()}</span>`);
  });

  return $('#root').html() ?? html;
}

async function loadSourceHtml(): Promise<string> {
  try {
    const response = await fetch('https://dpboss.boston/', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000)
    });

    if (response.ok) {
      return await response.text();
    }
  } catch {
    // Fallback to local snapshot when network is unavailable.
  }

  return readFile(FALLBACK_HTML_PATH, 'utf8');
}

function collectInnerHtml($: ReturnType<typeof load>, selector: string): string[] {
  return $(selector)
    .toArray()
    .map((element) => removeSelectedFooterLinks(rebrandHtml($(element).html() ?? '')))
    .filter((html) => html.trim().length > 0);
}

export async function getGeneralInfoSections(): Promise<GeneralInfoSections> {
  const html = await loadSourceHtml();
  const $ = load(html);

  return {
    skyBlocks: collectInnerHtml($, '.sky-23'),
    faqBlocks: collectInnerHtml($, '.qtn14'),
    stoneBlocks: collectInnerHtml($, '.be-stone'),
    disclaimerHtml: rebrandHtml($('.dis12').first().html() ?? ''),
    footerBlocks: collectInnerHtml($, '.lst-sec'),
    poweredHtml: rebrandHtml($('.pow-13').first().html() ?? '')
  };
}
