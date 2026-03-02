import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const [{ count: marketCount }, { count: chartCount }, { count: resultCount }] = await Promise.all([
    supabase.from('markets').select('*', { count: 'exact', head: true }),
    supabase.from('chart_records').select('*', { count: 'exact', head: true }),
    supabase.from('market_results').select('*', { count: 'exact', head: true })
  ]);

  return (
    <main>
      <AdminNav session={session} />
      <section className="admin-card">
        <h1>Admin Dashboard</h1>
        <p>
          Logged in as {session.loginId} ({session.role})
        </p>
      </section>
      <section className="admin-card">
        <h2>Data Summary</h2>
        <ul>
          <li>Markets: {marketCount ?? 0}</li>
          <li>Market outcomes: {resultCount ?? 0}</li>
          <li>Chart records: {chartCount ?? 0}</li>
        </ul>
      </section>
    </main>
  );
}
