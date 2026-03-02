'use client';

import { useEffect } from 'react';

const SCROLL_KEY = 'dlboss-home-scroll-y';

export function HomeScrollRestore() {
  useEffect(() => {
    const raw = window.sessionStorage.getItem(SCROLL_KEY);
    if (!raw) {
      return;
    }

    window.sessionStorage.removeItem(SCROLL_KEY);
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) {
      window.scrollTo({ top: value, behavior: 'auto' });
    }
  }, []);

  return null;
}

export function storeHomeScrollPosition() {
  window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
}
