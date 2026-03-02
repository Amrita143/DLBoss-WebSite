import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChartRecords, getMarketBySlug, getMarketResults } from '@/lib/page-resolver';

export const dynamic = 'force-dynamic';

export default async function MarketDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) {
    notFound();
  }

  const [results, jodiRecords, panelRecords] = await Promise.all([
    getMarketResults(market.id, 30),
    market.has_jodi ? getChartRecords(market.id, 'jodi', false) : Promise.resolve([]),
    market.has_panel ? getChartRecords(market.id, 'panel', false) : Promise.resolve([])
  ]);

  return (
    <main className="site-shell">
      <section className="hero-card">
        <h1>{market.name}</h1>
        <p>
          Timing: {market.open_time || '--'} - {market.close_time || '--'}
        </p>
        <p>
          <Link href="/">Back to all markets</Link>
        </p>
      </section>

      <section className="panel-card">
        <h2>Recent Outcomes</h2>
        {results.length === 0 ? (
          <p>No outcomes added yet.</p>
        ) : (
          <table className="result-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Open</th>
                <th>Close</th>
                <th>Jodi</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id}>
                  <td>{row.result_date}</td>
                  <td>
                    {row.open_panna || '--'} ({row.open_ank || '--'})
                  </td>
                  <td>
                    {row.close_panna || '--'} ({row.close_ank || '--'})
                  </td>
                  <td>{row.jodi || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel-card">
        <h2>Chart Access</h2>
        <div className="market-actions">
          {market.has_jodi ? <a href={`/jodi-chart-record/${market.slug}.php`}>Open Jodi Chart</a> : null}
          {market.has_panel ? <a href={`/panel-chart-record/${market.slug}.php`}>Open Panel Chart</a> : null}
        </div>
        <p>
          Loaded records: Jodi {jodiRecords.length}, Panel {panelRecords.length}
        </p>
      </section>
    </main>
  );
}
