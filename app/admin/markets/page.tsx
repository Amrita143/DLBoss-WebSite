import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { MarketsManager } from '@/app/admin/_components/MarketsManager';
import type { Market } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminMarketsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('markets').select('*').order('sort_order', { ascending: true });

  return (
    <main>
      <AdminNav />
      <section className="admin-card">
        <h1>Markets</h1>
      </section>
      <MarketsManager initialMarkets={(data ?? []) as Market[]} />
    </main>
  );
}
