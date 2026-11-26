import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS dekoratörleri için SWC gerekir (esbuild decorator metadata üretmez).
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    environment: 'node',
    // Entegrasyon testleri aynı veritabanını kullanır; sıralı çalıştır.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
