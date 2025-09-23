import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/lib/__tests__/**/*.test.ts']
  },
  css: {
    postcss: {
      plugins: []
    }
  }
});



