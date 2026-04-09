import type { MetadataRoute } from 'next';
import { getActiveMarkets } from '@/lib/page-resolver';
import { getSiteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteOrigin = getSiteOrigin();
  const markets = await getActiveMarkets();

  const latestMarketUpdate =
    markets.reduce<string | null>((latest, market) => {
      if (!latest || new Date(market.updated_at).getTime() > new Date(latest).getTime()) {
        return market.updated_at;
      }
      return latest;
    }, null) ?? new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteOrigin,
      lastModified: latestMarketUpdate,
      changeFrequency: 'hourly',
      priority: 1
    }
  ];

  for (const market of markets) {
    if (market.has_jodi) {
      entries.push({
        url: `${siteOrigin}/jodi-chart-record/${market.slug}.php`,
        lastModified: market.updated_at,
        changeFrequency: 'daily',
        priority: 0.8
      });
    }

    if (market.has_panel) {
      entries.push({
        url: `${siteOrigin}/panel-chart-record/${market.slug}.php`,
        lastModified: market.updated_at,
        changeFrequency: 'daily',
        priority: 0.8
      });
    }
  }

  return entries;
}
