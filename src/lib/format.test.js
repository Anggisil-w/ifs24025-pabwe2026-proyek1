import { describe, it, expect, afterEach, vi } from 'vitest';
import { countNights, formatDate, formatDateTime, formatRupiah, todayISO } from './format.js';

const plain = (text) => text.replace(/\s/g, ' ');

afterEach(() => vi.useRealTimers());

describe('formatRupiah', () => {
  it('memformat angka sebagai rupiah tanpa desimal', () => {
    expect(plain(formatRupiah(250000))).toBe('Rp 250.000');
    expect(plain(formatRupiah('1500000'))).toBe('Rp 1.500.000');
  });

  it('nilai tidak valid dianggap nol', () => {
    expect(plain(formatRupiah(undefined))).toBe('Rp 0');
    expect(plain(formatRupiah('abc'))).toBe('Rp 0');
  });
});

describe('formatDate', () => {
  it('memformat tanggal ISO tanpa bergeser hari', () => {
    const out = formatDate('2026-11-01');
    expect(out).toContain('2026');
    expect(out).toMatch(/^1 /);
  });

  it('nilai kosong menjadi tanda hubung', () => {
    expect(formatDate('')).toBe('-');
    expect(formatDate(null)).toBe('-');
  });

  it('tanggal tidak valid dikembalikan apa adanya', () => {
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal');
  });
});

describe('formatDateTime', () => {
  it('mengubah timestamp SQLite (UTC) menjadi WIB', () => {
    const out = formatDateTime('2026-11-01 03:00:00');
    expect(out).toContain('2026');
    expect(out).toMatch(/10[.:]00/);
  });

  it('menerima format ISO biasa', () => {
    expect(formatDateTime('2026-11-01T03:00:00Z')).toMatch(/10[.:]00/);
  });

  it('nilai kosong menjadi tanda hubung', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('')).toBe('-');
  });

  it('nilai tidak valid dikembalikan apa adanya', () => {
    expect(formatDateTime('kemarin')).toBe('kemarin');
  });
});

describe('countNights', () => {
  it('menghitung jumlah malam', () => {
    expect(countNights('2026-11-01', '2026-11-04')).toBe(3);
    expect(countNights('2026-11-01', '2026-11-01')).toBe(0);
  });

  it('input kosong atau tidak valid menghasilkan 0', () => {
    expect(countNights('', '2026-11-04')).toBe(0);
    expect(countNights('2026-11-01', null)).toBe(0);
    expect(countNights('x', 'y')).toBe(0);
  });
});

describe('todayISO', () => {
  it('memakai tanggal WIB, bukan UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T18:00:00Z')); // 01:00 WIB tanggal 2 Nov
    expect(todayISO()).toBe('2026-11-02');
  });
});
