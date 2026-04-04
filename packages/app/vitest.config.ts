import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const appNodeModules = path.resolve(__dirname, './node_modules');

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(appNodeModules, 'react'),
      'react/jsx-runtime': path.resolve(appNodeModules, 'react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(appNodeModules, 'react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(appNodeModules, 'react-dom'),
      'react-dom/client': path.resolve(appNodeModules, 'react-dom/client.js'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
});
