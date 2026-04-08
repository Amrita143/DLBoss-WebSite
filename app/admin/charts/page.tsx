import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { ChartsManager } from '@/app/admin/_components/ChartsManager';
import type { ChartRecord, Market } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function AdminChartsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const [{ data: records, count }, { data: markets }] = await Promise.all([
    supabase.from('chart_records').select('*', { count: 'exact' }).order('week_start', { ascending: false }).range(0, PAGE_SIZE - 1),
    supabase.from('markets').select('*').order('sort_order', { ascending: true })
  ]);

  return (
    <main>
      <AdminNav session={session} />
      <section className="admin-card">
        <h1>Charts</h1>
      </section>
      <ChartsManager
        initialRecords={(records ?? []) as ChartRecord[]}
        initialTotal={count ?? 0}
        pageSize={PAGE_SIZE}
        markets={(markets ?? []) as Market[]}
      />
    </main>
  );
}
