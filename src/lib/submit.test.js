import { describe, it, expect, vi, beforeEach } from 'vitest';

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('#lib/toast.svelte.js', () => ({ useToast: () => toast }));
vi.mock('#lib/api', () => ({
  toErrorInfo: (err) => ({ status: err.status ?? 0, message: err.message, details: [] })
}));

import { createSubmitter } from './submit.svelte.js';

beforeEach(() => toast.error.mockClear());

describe('createSubmitter', () => {
  it('awalnya tidak menyimpan dan tidak ada error', () => {
    const s = createSubmitter();
    expect(s.saving).toBe(false);
    expect(s.error).toBeNull();
  });

  it('run mengembalikan { ok: true, value } dan menyalakan saving selama berjalan', async () => {
    const s = createSubmitter();
    let during;
    const result = await s.run(async () => {
      during = s.saving;
      return 42;
    });
    expect(during).toBe(true);
    expect(result).toEqual({ ok: true, value: 42 });
    expect(s.saving).toBe(false);
    expect(s.error).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('run tidak melempar error: menyimpan error dan menampilkan toast', async () => {
    const s = createSubmitter();
    const result = await s.run(async () => {
      throw Object.assign(new Error('Gagal simpan'), { status: 409 });
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({ status: 409, message: 'Gagal simpan' });
    expect(s.error).toMatchObject({ message: 'Gagal simpan' });
    expect(s.saving).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Gagal simpan');
  });

  it('clearError menghapus error terakhir', async () => {
    const s = createSubmitter();
    await s.run(async () => {
      throw new Error('x');
    });
    s.clearError();
    expect(s.error).toBeNull();
  });

  it('run berikutnya mengosongkan error sebelumnya', async () => {
    const s = createSubmitter();
    await s.run(async () => {
      throw new Error('x');
    });
    await s.run(async () => 1);
    expect(s.error).toBeNull();
  });
});
