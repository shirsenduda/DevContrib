'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
