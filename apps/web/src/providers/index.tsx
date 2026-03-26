'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getQueryClient } from '@/lib/query-client';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
