import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { PagesManager } from '@/app/admin/_components/PagesManager';
import type { PageDoc } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('pages').select('*').order('path', { ascending: true }).limit(300);

  return (
    <main>
      <AdminNav session={session} />
      <section className="admin-card">
        <h1>Pages</h1>
      </section>
      <PagesManager initialPages={(data ?? []) as PageDoc[]} />
    </main>
  );
}
