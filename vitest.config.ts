import { defineConfig } from 'vitest/config';

export default defineConfig({
  tsconfig: 'tsconfig.base.json',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
  },
});
