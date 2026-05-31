'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_HOMEPAGE_MESSAGE_HTML, getHomepageMessageHtml, HOMEPAGE_MESSAGE_SETTING_KEY } from '@/lib/homepage-message';

interface Props {
  initialSettings: Array<{ id: string; setting_key: string; setting_value: Record<string, unknown> }>;
}

export function SettingsManager({ initialSettings }: Props) {
  const initialHomepageMessage = getHomepageMessageHtml(
    initialSettings.find((item) => item.setting_key === HOMEPAGE_MESSAGE_SETTING_KEY)?.setting_value
  );
  const [settings, setSettings] = useState(initialSettings);
  const [key, setKey] = useState('homepage_rotating_phrases');
  const [value, setValue] = useState('["Fix Ank","Kalyan Fix","Milan Fix","Fix open","Fix close","Fix jodi"]');
  const [error, setError] = useState('');
  const [homepageMessageHtml, setHomepageMessageHtml] = useState(initialHomepageMessage);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== homepageMessageHtml) {
      editorRef.current.innerHTML = homepageMessageHtml;
    }
  }, [homepageMessageHtml]);

  async function refresh() {
    const response = await fetch('/api/admin/settings');
    const payload = (await response.json()) as { items: Array<{ id: string; setting_key: string; setting_value: Record<string, unknown> }> };
    const nextSettings = payload.items ?? [];
    setSettings(nextSettings);
    setHomepageMessageHtml(
      getHomepageMessageHtml(nextSettings.find((item) => item.setting_key === HOMEPAGE_MESSAGE_SETTING_KEY)?.setting_value)
    );
  }

  async function save() {
    setError('');
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch {
      setError('Value must be valid JSON');
      return;
    }

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setting_key: key, setting_value: parsed })
    });

    if (!response.ok) {
      setError('Failed to save setting');
      return;
    }

    await refresh();
  }

  function syncHomepageMessage() {
    setHomepageMessageHtml(editorRef.current?.innerHTML || DEFAULT_HOMEPAGE_MESSAGE_HTML);
  }

  function applyCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false);
    syncHomepageMessage();
  }

  function wrapSelectionWithStyle(styleText: string) {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const span = document.createElement('span');
    span.setAttribute('style', styleText);
    span.appendChild(range.extractContents());
    range.insertNode(span);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);

    syncHomepageMessage();
  }

  async function saveHomepageMessage() {
    setError('');
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        setting_key: HOMEPAGE_MESSAGE_SETTING_KEY,
        setting_value: {
          html: homepageMessageHtml
        }
      })
    });

    if (!response.ok) {
      setError('Failed to save homepage message');
      return;
    }

    await refresh();
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Homepage Message Editor</h3>
        <p style={{ marginTop: 0, color: '#475569' }}>
          This text appears between the main DLBOSS heading and the <code>☔ LIVE RESULT ☔</code> section.
        </p>

        <div className="rich-editor-toolbar">
          <button className="admin-btn secondary" type="button" onClick={() => applyCommand('bold')}>
            Bold
          </button>
          <label className="rich-editor-control">
            Font Size
            <select
              className="admin-select"
              defaultValue="18"
              onChange={(event) => wrapSelectionWithStyle(`font-size: ${event.target.value}px;`)}
            >
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
              <option value="24">24px</option>
              <option value="28">28px</option>
            </select>
          </label>
          <label className="rich-editor-control">
            Text Color
            <input type="color" defaultValue="#111111" onChange={(event) => wrapSelectionWithStyle(`color: ${event.target.value};`)} />
          </label>
          <label className="rich-editor-control">
            Highlight
            <input
              type="color"
              defaultValue="#ffd54f"
              onChange={(event) => wrapSelectionWithStyle(`background-color: ${event.target.value};`)}
            />
          </label>
        </div>

        <div
          ref={editorRef}
          className="rich-editor-surface"
          contentEditable
          suppressContentEditableWarning
          onInput={syncHomepageMessage}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="admin-btn" type="button" onClick={saveHomepageMessage}>
            Save Homepage Message
          </button>
          <button className="admin-btn secondary" type="button" onClick={() => setHomepageMessageHtml(DEFAULT_HOMEPAGE_MESSAGE_HTML)}>
            Reset to Default
          </button>
        </div>
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      </div>

      <div className="admin-card">
        <h3>Upsert Setting</h3>
        <input className="admin-input" value={key} onChange={(event) => setKey(event.target.value)} />
        <textarea className="admin-textarea" value={value} onChange={(event) => setValue(event.target.value)} />
        <button className="admin-btn" type="button" onClick={save}>
          Save
        </button>
      </div>

      <div className="admin-card">
        <h3>Current Settings</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((item) => (
              <tr key={item.id}>
                <td>{item.setting_key}</td>
                <td>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(item.setting_value)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
