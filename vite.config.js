import { sveltekit } from '@sveltejs/kit/vite';
import adapterBun from '@sveltejs/adapter-bun';
import adapterVercel from '@sveltejs/adapter-vercel';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

// Di Vercel (env VERCEL=1) pakai adapter-vercel; selain itu (lokal/server) pakai adapter-bun
const adapter = process.env.VERCEL ? adapterVercel() : adapterBun();

export default defineConfig({
  // SvelteKit 3: konfigurasi dilewatkan lewat plugin sveltekit(...), svelte.config.js tidak dipakai lagi
  plugins: [tailwindcss(), sveltekit({ adapter }), svelteTesting()],
  server: {
    // Port yang sama dengan CORS_ORIGIN di backend (http://localhost:5173)
    port: 5173,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./vitest-setup.js'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // lcov dibutuhkan SonarQube (coverage/lcov.info)
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      // File yang hanya berisi re-export tidak punya statement untuk diukur
      exclude: ['src/**/*.test.js', 'src/**/*.d.ts', 'src/lib/validators.js', 'src/routes/auth/login/+page.server.js']
    }
  }
});