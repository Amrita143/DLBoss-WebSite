import type { AdminSession } from '@/lib/types';

interface Props {
  session: AdminSession;
}

export function AdminNav({ session }: Props) {
  return (
    <nav className="admin-nav">
      <a href="/admin">Dashboard</a>
      <a href="/admin/markets">Markets</a>
      <a href="/admin/results">Outcomes</a>
      <a href="/admin/charts">Charts</a>
      {session.role === 'superadmin' ? <a href="/admin/admins">Admins</a> : null}
      <form action="/api/admin/logout" method="post" style={{ display: 'inline' }}>
        <button className="admin-btn secondary" type="submit">
          Logout
        </button>
      </form>
    </nav>
  );
}
