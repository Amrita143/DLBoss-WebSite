export function AdminNav() {
  return (
    <nav className="admin-nav">
      <a href="/admin">Dashboard</a>
      <a href="/admin/markets">Markets</a>
      <a href="/admin/results">Outcomes</a>
      <a href="/admin/charts">Charts</a>
      <form action="/api/admin/logout" method="post" style={{ display: 'inline' }}>
        <button className="admin-btn secondary" type="submit">
          Logout
        </button>
      </form>
    </nav>
  );
}
