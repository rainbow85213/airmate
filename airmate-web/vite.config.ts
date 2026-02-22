import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @airmate/shared → packages/shared/src/index.ts
      '@airmate/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
    },
    // 모노레포에서 React 인스턴스가 중복 로드되지 않도록 강제 단일화
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
});
