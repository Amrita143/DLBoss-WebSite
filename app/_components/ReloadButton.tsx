'use client';

import type { PropsWithChildren } from 'react';
import { storeHomeScrollPosition } from '@/app/_components/HomeScrollRestore';

type ReloadButtonProps = PropsWithChildren<{
  className?: string;
}>;

export function ReloadButton({ children, className }: ReloadButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        storeHomeScrollPosition();
        window.location.reload();
      }}
    >
      {children}
    </button>
  );
}
