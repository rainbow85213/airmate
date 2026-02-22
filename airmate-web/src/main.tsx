import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';

/**
 * React Query 전역 클라이언트 설정
 * - staleTime: 0 (기본값, 개별 쿼리에서 오버라이드)
 * - gcTime: 10분 (언마운트된 쿼리의 캐시 유지 시간)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000,
      retry: false, // 개별 훅에서 retry 설정을 관리
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
