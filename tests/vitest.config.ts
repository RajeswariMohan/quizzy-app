import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
    },
  },
  test: {
    root: path.resolve(__dirname),
    include: ['frontend/**/*.test.ts'],
    environment: 'node',
    reporters: ['verbose'],
  },
});
