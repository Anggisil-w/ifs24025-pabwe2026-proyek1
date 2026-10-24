import { describe, it, expect, beforeEach, vi } from 'vitest';

const ctx = vi.hoisted(() => new Map());
vi.mock('svelte', async (importOriginal) => ({
  ...(await importOriginal()),
  setContext: (key, value) => ctx.set(key, value),
  getContext: (key) => ctx.get(key)
}));

import { createSession, provideSession, useSession } from './session.js';

beforeEach(() => ctx.clear());

describe('createSession', () => {
  it('pengguna null: belum login', () => {
    const s = createSession(() => null);
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isAdmin).toBe(false);
    expect(s.hasRole('admin')).toBe(false);
  });

  it('undefined dinormalkan menjadi null', () => {
    expect(createSession(() => undefined).user).toBeNull();
  });

  it('admin dikenali', () => {
    const s = createSession(() => ({ id: 1, role: 'admin' }));
    expect(s.isAuthenticated).toBe(true);
    expect(s.isAdmin).toBe(true);
    expect(s.hasRole('guest', 'admin')).toBe(true);
  });

  it('selalu mengikuti getter terbaru', () => {
    let user = null;
    const s = createSession(() => user);
    expect(s.isAuthenticated).toBe(false);
    user = { role: 'guest' };
    expect(s.isAuthenticated).toBe(true);
    expect(s.isAdmin).toBe(false);
  });
});

describe('provideSession / useSession', () => {
  it('useSession mengembalikan sesi yang disediakan', () => {
    const provided = provideSession(() => ({ role: 'guest' }));
    expect(useSession()).toBe(provided);
  });

  it('useSession tanpa provider melempar error', () => {
    expect(() => useSession()).toThrow(/provideSession/);
  });
});
