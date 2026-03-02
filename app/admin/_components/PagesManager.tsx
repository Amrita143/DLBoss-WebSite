'use client';

import { useState } from 'react';
import type { PageDoc } from '@/lib/types';

interface Props {
  initialPages: PageDoc[];
}

export function PagesManager({ initialPages }: Props) {
  const [pages, setPages] = useState(initialPages);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    path: '/new-page.php',
    page_type: 'content',
    title: 'New Page',
    meta_description: '',
    meta_keywords: ''
  });

  async function refresh() {
    const response = await fetch('/api/admin/pages?limit=100');
    const payload = (await response.json()) as { items: PageDoc[] };
    setPages(payload.items ?? []);
  }

  async function createPage() {
    setError('');
    const response = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError('Failed to create page');
      return;
    }

    await refresh();
  }

  async function togglePublish(page: PageDoc) {
    const response = await fetch(`/api/admin/pages/${page.id}/publish`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_published: !page.is_published })
    });

    if (!response.ok) {
      setError('Failed to publish/unpublish page');
      return;
    }

    await refresh();
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Create Page</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
          <input className="admin-input" value={form.path} onChange={(event) => setForm((state) => ({ ...state, path: event.target.value }))} />
          <select
            className="admin-select"
            value={form.page_type}
            onChange={(event) => setForm((state) => ({ ...state, page_type: event.target.value }))}
          >
            <option value="home">home</option>
            <option value="chart">chart</option>
            <option value="content">content</option>
            <option value="utility">utility</option>
          </select>
          <input className="admin-input" value={form.title} onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))} />
          <input
            className="admin-input"
            value={form.meta_description}
            onChange={(event) => setForm((state) => ({ ...state, meta_description: event.target.value }))}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="admin-btn" type="button" onClick={createPage}>
            Create
          </button>
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </div>
      </div>

      <div className="admin-card">
        <h3>Pages</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>{page.path}</td>
                <td>{page.page_type}</td>
                <td>{page.title}</td>
                <td>{page.is_published ? 'published' : 'draft'}</td>
                <td>
                  <button className="admin-btn secondary" type="button" onClick={() => togglePublish(page)}>
                    {page.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
