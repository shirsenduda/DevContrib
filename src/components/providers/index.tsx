'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';
import { TopLoader } from '@/components/layout/top-loader';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        {children}
      </QueryProvider>
    </SessionProvider>
  );
}
