const DEFAULT_SITE_URL = 'https://www.dlbosss.com';

function getRawSiteUrl(): string {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (explicitSiteUrl) {
    try {
      const hostname = new URL(explicitSiteUrl).hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return explicitSiteUrl;
      }
    } catch {
      // Fall through to deployment defaults.
    }
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return explicitSiteUrl || DEFAULT_SITE_URL;
}

function normalizeSiteUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);

  if (url.hostname === 'dlbosss.com') {
    url.hostname = 'www.dlbosss.com';
  }

  url.hash = '';
  url.search = '';
  url.pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '') || '/';

  return url;
}

export function getSiteUrl(): URL {
  const rawUrl = getRawSiteUrl();

  try {
    return normalizeSiteUrl(rawUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function getSiteOrigin(): string {
  return getSiteUrl().origin;
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${getSiteOrigin()}/`).toString();
}
