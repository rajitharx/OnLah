import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Vitest blanks CSS imports, even ?raw, unless included; a test reads the stylesheet source.
    css: { include: [/styles\.css/] },
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
});
