import Image from 'next/image';
import Link from 'next/link';
import { getActiveMarkets, getLatestResultsByMarket } from '@/lib/page-resolver';
import { HomeScrollRestore } from '@/app/_components/HomeScrollRestore';
import { ReloadButton } from '@/app/_components/ReloadButton';
import { getGeneralInfoSections } from '@/lib/dpboss-general-info';
import type { MarketResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

type HomeMarket = {
  id: string;
  slug: string;
  name: string;
  open_time: string | null;
  close_time: string | null;
  has_jodi: boolean;
  has_panel: boolean;
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

export default async function HomePage() {
  const markets = await getActiveMarkets();
  const latestByMarket = await getLatestResultsByMarket(markets.map((market) => market.id));
  const generalInfo = await getGeneralInfoSections();

  const rows: HomeMarket[] = markets.map((market) => ({
    id: market.id,
    slug: market.slug,
    name: market.name,
    open_time: market.open_time,
    close_time: market.close_time,
    has_jodi: market.has_jodi,
    has_panel: market.has_panel,
    latest: latestByMarket.get(market.id)
  }));

  const liveRows = sortByResultDate(rows).slice(0, 12);

  return (
    <main className="site-shell dl-home-shell">
      <HomeScrollRestore />

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
              <div key={market.id} className="live-item">
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
            <article key={market.id} className="market-row">
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
                <Link href={`/market/${market.slug}`} className="gm-clk">
                  Market Details
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

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
