import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ctx = vi.hoisted(() => new Map());
vi.mock('svelte', async (importOriginal) => ({
  ...(await importOriginal()),
  setContext: (key, value) => ctx.set(key, value),
  getContext: (key) => ctx.get(key)
}));

import { Toaster, provideToaster, useToast } from './toast.svelte.js';

beforeEach(() => {
  ctx.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const messages = (t) => t.items.map((i) => i.message);

describe('Toaster', () => {
  it('show menambah item dengan id berurutan dan varian bawaan info', () => {
    const t = new Toaster();
    expect(t.show('a')).toBe(1);
    expect(t.show('b', 'success')).toBe(2);
    expect(t.items.map((i) => i.variant)).toEqual(['info', 'success']);
  });

  it('success, error, dan info memakai varian masing-masing', () => {
    const t = new Toaster();
    t.success('s');
    t.error('e');
    t.info('i');
    expect(t.items.map((i) => i.variant)).toEqual(['success', 'error', 'info']);
  });

  it('item hilang otomatis setelah durasi (5 dtk, error 8 dtk)', () => {
    const t = new Toaster();
    t.info('a');
    t.error('b');
    vi.advanceTimersByTime(4999);
    expect(messages(t)).toEqual(['a', 'b']);
    vi.advanceTimersByTime(1);
    expect(messages(t)).toEqual(['b']);
    vi.advanceTimersByTime(3000);
    expect(messages(t)).toEqual([]);
  });

  it('durasi 0 membuat toast tidak hilang otomatis', () => {
    const t = new Toaster();
    t.show('tetap', 'info', 0);
    vi.advanceTimersByTime(60000);
    expect(messages(t)).toEqual(['tetap']);
  });

  it('dismiss menghapus item dan membatalkan timernya', () => {
    const t = new Toaster();
    const id = t.info('a');
    t.dismiss(id);
    expect(t.items).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dismiss id yang tidak ada tidak melempar error', () => {
    const t = new Toaster();
    t.info('a');
    expect(() => t.dismiss(999)).not.toThrow();
    expect(t.items).toHaveLength(1);
  });

  it('destroy membersihkan semua timer', () => {
    const t = new Toaster();
    t.info('a');
    t.error('b');
    expect(vi.getTimerCount()).toBe(2);
    t.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('konteks toast', () => {
  it('provideToaster menyimpan instance yang diambil useToast', () => {
    const provided = provideToaster();
    expect(provided).toBeInstanceOf(Toaster);
    expect(useToast()).toBe(provided);
  });

  it('useToast tanpa provider melempar error yang jelas', () => {
    expect(() => useToast()).toThrow(/provideToaster/);
  });
});
