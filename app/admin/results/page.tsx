import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { ResultsManager } from '@/app/admin/_components/ResultsManager';
import type { Market, MarketResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const [{ data: markets }, { data: results }] = await Promise.all([
    supabase.from('markets').select('*').order('sort_order', { ascending: true }),
    supabase.from('market_results').select('*').order('result_date', { ascending: false }).limit(200)
  ]);

  return (
    <main>
      <AdminNav />
      <section className="admin-card">
        <h1>Outcomes</h1>
        <p>Manage daily market outcomes shown to users on the public site.</p>
      </section>
      <ResultsManager initialResults={(results ?? []) as MarketResult[]} markets={(markets ?? []) as Market[]} />
    </main>
  );
}
