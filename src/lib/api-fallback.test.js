import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: '' }));

async function loadApi() {
  vi.resetModules();
  return import('./api.js');
}

describe('BACKEND_API_URL: fallback saat PUBLIC_API_BASE_URL kosong', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it('development -> localhost', async () => {
    vi.stubEnv('DEV', true);
    const { BACKEND_API_URL } = await loadApi();
    expect(BACKEND_API_URL).toBe('http://localhost:3000/api');
  });

  it('produksi -> backend Railway', async () => {
    vi.stubEnv('DEV', false);
    const { BACKEND_API_URL } = await loadApi();
    expect(BACKEND_API_URL).toBe('https://ifs24025-pabwe2026-proyek1-backend-production.up.railway.app/api');
  });
});
