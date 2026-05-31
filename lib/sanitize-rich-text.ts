import { load } from 'cheerio';
import { sanitizeHexColor } from '@/lib/chart-display';
import { DEFAULT_HOMEPAGE_MESSAGE_HTML } from '@/lib/homepage-message';

const ALLOWED_TAGS = new Set(['p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'br']);
const ALLOWED_TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify']);
const ALLOWED_FONT_STYLE = new Set(['normal', 'italic']);
const ALLOWED_TEXT_DECORATION = new Set(['none', 'underline']);
const ALLOWED_FONT_WEIGHT = new Set(['400', '500', '600', '700', '800', '900', 'bold']);

function sanitizeFontSize(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!/^\d{1,2}px$/.test(trimmed)) {
    return null;
  }

  const size = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(size) || size < 10 || size > 48) {
    return null;
  }

  return `${size}px`;
}

function sanitizeStyleAttribute(styleValue: string | undefined): string | null {
  if (!styleValue) {
    return null;
  }

  const safeDeclarations: string[] = [];

  for (const declaration of styleValue.split(';')) {
    const [rawProperty, rawValue] = declaration.split(':');
    if (!rawProperty || !rawValue) {
      continue;
    }

    const property = rawProperty.trim().toLowerCase();
    const value = rawValue.trim();

    if (property === 'color' || property === 'background-color') {
      const safeColor = sanitizeHexColor(value);
      if (safeColor) {
        safeDeclarations.push(`${property}: ${safeColor}`);
      }
      continue;
    }

    if (property === 'font-size') {
      const safeSize = sanitizeFontSize(value);
      if (safeSize) {
        safeDeclarations.push(`${property}: ${safeSize}`);
      }
      continue;
    }

    if (property === 'font-style') {
      const normalized = value.toLowerCase();
      if (ALLOWED_FONT_STYLE.has(normalized)) {
        safeDeclarations.push(`${property}: ${normalized}`);
      }
      continue;
    }

    if (property === 'font-weight') {
      const normalized = value.toLowerCase();
      if (ALLOWED_FONT_WEIGHT.has(normalized)) {
        safeDeclarations.push(`${property}: ${normalized}`);
      }
      continue;
    }

    if (property === 'text-decoration') {
      const normalized = value.toLowerCase();
      if (ALLOWED_TEXT_DECORATION.has(normalized)) {
        safeDeclarations.push(`${property}: ${normalized}`);
      }
      continue;
    }

    if (property === 'text-align') {
      const normalized = value.toLowerCase();
      if (ALLOWED_TEXT_ALIGN.has(normalized)) {
        safeDeclarations.push(`${property}: ${normalized}`);
      }
    }
  }

  return safeDeclarations.length > 0 ? safeDeclarations.join('; ') : null;
}

export function sanitizeRichTextHtml(html: string | null | undefined): string {
  if (!html || !html.trim()) {
    return DEFAULT_HOMEPAGE_MESSAGE_HTML;
  }

  const $ = load(`<div id="rich-text-root">${html}</div>`);
  $('#rich-text-root script, #rich-text-root style, #rich-text-root iframe, #rich-text-root object, #rich-text-root embed, #rich-text-root link, #rich-text-root meta').remove();

  $('#rich-text-root *')
    .toArray()
    .forEach((element) => {
      const tagName = element.tagName?.toLowerCase();
      if (!tagName) {
        return;
      }

      if (!ALLOWED_TAGS.has(tagName)) {
        $(element).replaceWith($(element).contents());
        return;
      }

      for (const attributeName of Object.keys(element.attribs ?? {})) {
        if (attributeName !== 'style') {
          $(element).removeAttr(attributeName);
        }
      }

      const safeStyle = sanitizeStyleAttribute($(element).attr('style'));
      if (safeStyle) {
        $(element).attr('style', safeStyle);
      } else {
        $(element).removeAttr('style');
      }
    });

  const sanitized = $('#rich-text-root').html()?.trim();
  return sanitized || DEFAULT_HOMEPAGE_MESSAGE_HTML;
}
