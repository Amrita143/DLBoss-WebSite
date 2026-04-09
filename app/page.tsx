import type { Metadata } from 'next';
import Image from 'next/image';
import { sanitizeHexColor } from '@/lib/chart-display';
import { getActiveMarkets, getLatestResultsByMarket } from '@/lib/page-resolver';
import { HomeScrollRestore } from '@/app/_components/HomeScrollRestore';
import { ReloadButton } from '@/app/_components/ReloadButton';
import { getGeneralInfoSections } from '@/lib/dpboss-general-info';
import { PANNA_PATTI_RECORDS } from '@/lib/panna-patti-records';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import type { Market, MarketResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

const siteUrl = getSiteUrl();
const homeTitle = 'DLBOSS.COM | Satta Matka | Kalyan Matka | Fast Result';
const homeDescription =
  'Check live market outcomes, jodi charts, and panel charts on DLBOSS.COM with fast admin-managed updates.';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: homeTitle,
    description: homeDescription
  },
  twitter: {
    card: 'summary',
    title: homeTitle,
    description: homeDescription
  }
};

type HomeMarket = {
  id: string;
  slug: string;
  name: string;
  open_time: string | null;
  close_time: string | null;
  has_jodi: boolean;
  has_panel: boolean;
  is_highlighted: boolean;
  highlight_color: string;
  latest?: MarketResult;
};

function sortByResultDate(rows: HomeMarket[]): HomeMarket[] {
  return [...rows].sort((a, b) => {
    const aTime = a.latest?.result_date ? Date.parse(a.latest.result_date) : 0;
    const bTime = b.latest?.result_date ? Date.parse(b.latest.result_date) : 0;
    return bTime - aTime;
  });
}

function formatMainResult(latest?: MarketResult): string {
  if (!latest) {
    return 'Loading...';
  }

  if (latest.open_panna && latest.jodi && latest.close_panna) {
    return `${latest.open_panna}-${latest.jodi}-${latest.close_panna}`;
  }

  if (latest.open_panna || latest.close_panna) {
    return `${latest.open_panna || '***'}-${latest.open_ank || '**'}-${latest.close_panna || '***'}`;
  }

  if (latest.jodi) {
    return latest.jodi;
  }

  return 'Loading...';
}

function formatRange(open: string | null, close: string | null): string {
  return `${open || '--'}   ${close || '--'}`;
}

function getHighlightStyle(market: Pick<Market, 'is_highlighted' | 'highlight_color'>) {
  const safeColor = sanitizeHexColor(market.highlight_color);
  if (!market.is_highlighted || !safeColor) {
    return undefined;
  }

  return { backgroundColor: safeColor };
}

export default async function HomePage() {
  const markets = await getActiveMarkets();
  const latestByMarket = await getLatestResultsByMarket(markets.map((market) => market.id));
  const generalInfo = await getGeneralInfoSections();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'DLBOSS',
      alternateName: ['DL BOSS', 'DLBOSS.COM', 'DLBOSSS', 'DLBOSSS.COM'],
      url: siteUrl.toString()
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DLBOSS',
      alternateName: ['DL BOSS', 'DLBOSS.COM', 'DLBOSSS', 'DLBOSSS.COM'],
      url: siteUrl.toString(),
      logo: absoluteUrl('/icon.jpg')
    }
  ];

  const rows: HomeMarket[] = markets.map((market) => ({
    id: market.id,
    slug: market.slug,
    name: market.name,
    open_time: market.open_time,
    close_time: market.close_time,
    has_jodi: market.has_jodi,
    has_panel: market.has_panel,
    is_highlighted: market.is_highlighted,
    highlight_color: market.highlight_color,
    latest: latestByMarket.get(market.id)
  }));

  const liveRows = sortByResultDate(rows).slice(0, 12);

  return (
    <main className="site-shell dl-home-shell">
      <HomeScrollRestore />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="m-icon" id="top-brand">
        <Image src="/dlboss-logo.svg" alt="DLBOSS.COM" width={816} height={271} priority />
      </header>

      <section className="welcome-strip">
        <p>!! Welcome to DLBOSS.COM International !! Satta Matka Fast Result</p>
      </section>

      <section className="text2 intro-box">
        <h1>Satta Matka DLBOSS.COM Kalyan Matka Result</h1>
      </section>

      <section className="liv-rslt" id="live-results">
        <h4>☔ LIVE RESULT ☔</h4>
        <div className="live-caption">Sabse Tezz Live Result Yahi Milega</div>
        {liveRows.length === 0 ? (
          <div className="lv-mc">
            <span className="h8">No Active Markets</span>
            <span className="h9">Add markets and outcomes from Admin</span>
          </div>
        ) : (
          <div className="lv-mc">
            {liveRows.map((market) => (
              <div key={market.id} className="live-item" style={getHighlightStyle(market)}>
                <span className="h8">{market.name.toUpperCase()}</span>
                <span className="h9">{formatMainResult(market.latest)}</span>
                <ReloadButton className="reload-btn">Refresh</ReloadButton>
              </div>
            ))}
          </div>
        )}
      </section>

      <h4 className="flyr24">WORLD ME SABSE FAST SATTA MATKA RESULT</h4>

      {rows.length === 0 ? (
        <section className="tkt-val no-market-box">
          <h4>No active markets available</h4>
          <p>Create markets and outcomes from /admin to publish live rows on homepage.</p>
        </section>
      ) : (
        <section className="tkt-val" id="market-results">
          {rows.map((market) => (
            <article key={market.id} className={`market-row${market.is_highlighted ? ' market-row-highlighted' : ''}`} style={getHighlightStyle(market)}>
              <h4>{market.name.toUpperCase()}</h4>
              <span>{formatMainResult(market.latest)}</span>
              <p>{formatRange(market.open_time, market.close_time)}</p>

              <div className="result-actions">
                {market.has_jodi ? (
                  <a href={`/jodi-chart-record/${market.slug}.php`} className="gm-clk">
                    Jodi Chart
                  </a>
                ) : null}
                {market.has_panel ? (
                  <a href={`/panel-chart-record/${market.slug}.php`} className="gm-clk">
                    Panel Chart
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="panna-patti-section" aria-labelledby="panna-patti-heading">
        <h4 id="panna-patti-heading">PANNA PATTI CHART RECORD</h4>
        <div className="panna-patti-list">
          {PANNA_PATTI_RECORDS.map((record) => (
            <article key={record.id} className="panna-patti-card">
              <div className="panna-patti-heading">
                <span>{record.left}</span>
                <span className="panna-patti-digit" style={{ color: record.accentColor }}>
                  ({record.digit})
                </span>
                <span>{record.right}</span>
              </div>
              <div className="panna-patti-rows">
                {record.rows.map((row) => (
                  <p key={`${record.id}-${row}`}>{row}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {generalInfo.faqBlocks.map((html, index) => (
        <section
          key={`faq-${index}`}
          className="qtn14"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}

      {generalInfo.stoneBlocks.map((html, index) => (
        <section
          key={`stone-${index}`}
          className="be-stone"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}

      {generalInfo.disclaimerHtml ? (
        <section className="dis12" dangerouslySetInnerHTML={{ __html: generalInfo.disclaimerHtml }} />
      ) : null}

      {generalInfo.footerBlocks.map((html, index) => (
        <section
          key={`footer-${index}`}
          className="lst-sec"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}

      <h6 className="pow-13">{generalInfo.poweredHtml || 'POWERED BY DLBOSS.COM'}</h6>
    </main>
  );
}
