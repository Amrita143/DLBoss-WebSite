import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AdminNav } from '@/app/admin/_components/AdminNav';
import { AdminsManager } from '@/app/admin/_components/AdminsManager';
import type { AdminUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminAdminsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  if (session.role !== 'superadmin') {
    redirect('/admin');
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, login_id, email, role, created_at, updated_at')
    .order('created_at', { ascending: true });

  return (
    <main>
      <AdminNav session={session} />
      <section className="admin-card">
        <h1>Admins</h1>
        <p>Create and remove admin accounts. Admin IDs are used for login.</p>
      </section>
      <AdminsManager initialAdmins={(data ?? []) as AdminUser[]} />
    </main>
  );
}
