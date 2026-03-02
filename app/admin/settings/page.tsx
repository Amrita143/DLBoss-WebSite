import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { SettingsManager } from '@/app/admin/_components/SettingsManager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('site_settings').select('*').order('setting_key', { ascending: true });

  return (
    <main>
      <AdminNav />
      <section className="admin-card">
        <h1>Settings</h1>
      </section>
      <SettingsManager initialSettings={(data ?? []) as Array<{ id: string; setting_key: string; setting_value: Record<string, unknown> }>} />
    </main>
  );
}
