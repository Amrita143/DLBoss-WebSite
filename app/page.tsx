import Link from 'next/link';
import { getActiveMarkets, getLatestResultsByMarket } from '@/lib/page-resolver';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const markets = await getActiveMarkets();
  const latestByMarket = await getLatestResultsByMarket(markets.map((market) => market.id));

  return (
    <main className="site-shell">
      <section className="hero-card">
        <h1>Market Results Dashboard</h1>
        <p>All data below is managed directly from the Admin panel. No scraped content is used.</p>
      </section>

      {markets.length === 0 ? (
        <section className="panel-card">
          <h2>No active markets</h2>
          <p>Admin can create markets and add outcomes from the backend panel.</p>
          <p>
            If markets already exist, this usually means your app cannot reach Supabase from current network/DNS.
          </p>
        </section>
      ) : (
        <section className="market-grid">
          {markets.map((market) => {
            const latest = latestByMarket.get(market.id);

            return (
              <article className="market-card" key={market.id}>
                <div className="market-head">
                  <h2>{market.name}</h2>
                  <span className="slug">/{market.slug}</span>
                </div>

                <p className="timing">
                  <strong>Timing:</strong> {market.open_time || '--'} - {market.close_time || '--'}
                </p>

                <div className="latest-box">
                  <h3>Latest Outcome</h3>
                  {latest ? (
                    <>
                      <p>
                        <strong>Date:</strong> {latest.result_date}
                      </p>
                      <p>
                        <strong>Open:</strong> {latest.open_panna || '--'} ({latest.open_ank || '--'})
                      </p>
                      <p>
                        <strong>Close:</strong> {latest.close_panna || '--'} ({latest.close_ank || '--'})
                      </p>
                      <p>
                        <strong>Jodi:</strong> {latest.jodi || '--'}
                      </p>
                    </>
                  ) : (
                    <p>No outcomes added yet.</p>
                  )}
                </div>

                <div className="market-actions">
                  {market.has_jodi ? <a href={`/jodi-chart-record/${market.slug}.php`}>Jodi Chart</a> : null}
                  {market.has_panel ? <a href={`/panel-chart-record/${market.slug}.php`}>Panel Chart</a> : null}
                  <Link href={`/market/${market.slug}`}>Market Details</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
