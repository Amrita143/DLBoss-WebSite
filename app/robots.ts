import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/'
      }
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin
  };
}
