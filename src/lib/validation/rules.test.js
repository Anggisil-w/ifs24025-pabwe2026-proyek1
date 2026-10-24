import { describe, it, expect } from 'vitest';
import {
  LIMITS,
  checkEmail,
  checkInteger,
  checkOptionalPhone,
  checkOptionalUrl,
  checkPersonName,
  checkText,
  hasControlChars,
  isBlank,
  isValidEmail,
  isValidHttpUrl,
  isValidIsoDate,
  isValidPhone,
  toInteger
} from './rules.js';

describe('predikat dasar', () => {
  it('isBlank mengenali nilai kosong dan spasi', () => {
    for (const value of ['', '   ', null, undefined, '\n\t']) expect(isBlank(value)).toBe(true);
    for (const value of ['a', 0, ' a ']) expect(isBlank(value)).toBe(false);
  });

  it('hasControlChars', () => {
    expect(hasControlChars('halo\u0000')).toBe(true);
    expect(hasControlChars('baris\nbaru')).toBe(true);
    expect(hasControlChars('aman')).toBe(false);
  });

  it('isValidEmail menerima yang wajar dan menolak yang janggal', () => {
    for (const ok of ['a@b.co', ' a@b.co ', 'nama.belakang+tag@sub.contoh.id']) expect(isValidEmail(ok)).toBe(true);
    const bad = ['a@b', 'a b@c.com', '@b.com', 'a@.com', 'a..b@c.com', '.a@c.com', 'a.@c.com', 'a@b..com', 'a@-b.com', '', 'a@b@c.com'];
    for (const value of bad) expect(isValidEmail(value), value).toBe(false);
    expect(isValidEmail(`${'a'.repeat(65)}@contoh.com`)).toBe(false); // bagian lokal > 64
    expect(isValidEmail(`a@${'b'.repeat(250)}.com`)).toBe(false); // total > 254
  });

  it('isValidPhone memeriksa pola dan jumlah digit', () => {
    for (const ok of ['081234567890', '+62 812-3456-7890', '(061) 123456']) expect(isValidPhone(ok)).toBe(true);
    for (const bad of ['12345', 'abc123456', '((((((', '+62 812 3456 7890 1234 5', '']) expect(isValidPhone(bad), bad).toBe(false);
  });

  it('isValidHttpUrl hanya menerima http/https lengkap tanpa kredensial', () => {
    for (const ok of ['https://contoh.com/a.jpg', 'http://contoh.com', 'https://contoh.com:8080/a?b=1']) {
      expect(isValidHttpUrl(ok)).toBe(true);
    }
    const bad = ['ftp://contoh.com', 'contoh.com', 'javascript:alert(1)', 'https://', 'https://user:pw@contoh.com', 'https://con toh.com', `https://x.com/${'a'.repeat(500)}`];
    for (const value of bad) expect(isValidHttpUrl(value), value).toBe(false);
  });

  it('isValidIsoDate menolak tanggal yang tidak ada di kalender', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true); // kabisat
    for (const bad of ['2026-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '26-01-01', '2026-1-1', '', null]) {
      expect(isValidIsoDate(bad), String(bad)).toBe(false);
    }
  });

  it('toInteger hanya menerima bilangan bulat murni', () => {
    expect(toInteger(5)).toBe(5);
    expect(toInteger(' 12 ')).toBe(12);
    expect(toInteger('-3')).toBe(-3);
    for (const bad of ['1.5', '1e3', '0x10', 'abc', '', null, undefined, 2.5, NaN, Infinity]) {
      expect(Number.isNaN(toInteger(bad)), String(bad)).toBe(true);
    }
  });
});

describe('pemeriksa field', () => {
  it('checkText: wajib, panjang, karakter kontrol', () => {
    const opts = { label: 'Nama', min: 3, max: 5 };
    expect(checkText('', opts)).toBe('Nama wajib diisi');
    expect(checkText('ab', opts)).toBe('Nama minimal 3 karakter');
    expect(checkText('abcdef', opts)).toBe('Nama maksimal 5 karakter');
    expect(checkText('abc', opts)).toBeUndefined();
    expect(checkText('a\u0000bc', opts)).toMatch(/tidak diizinkan/);
    expect(checkText('a\nbc', { ...opts, singleLine: false })).toBeUndefined();
  });

  it('checkText opsional membolehkan kosong', () => {
    expect(checkText('  ', { label: 'Deskripsi', required: false, max: 10 })).toBeUndefined();
    expect(checkText('x'.repeat(11), { label: 'Deskripsi', required: false, max: 10 })).toMatch(/maksimal/);
  });

  it('checkPersonName wajib mengandung huruf', () => {
    expect(checkPersonName('Budi')).toBeUndefined();
    expect(checkPersonName('Nguyễn Thị')).toBeUndefined();
    expect(checkPersonName('12345')).toBe('Nama harus mengandung huruf');
    expect(checkPersonName('B')).toMatch(/minimal 2/);
  });

  it('checkEmail', () => {
    expect(checkEmail('')).toBe('Email wajib diisi');
    expect(checkEmail('salah')).toBe('Format email tidak valid');
    expect(checkEmail('a@b.co')).toBeUndefined();
  });

  it('checkOptionalPhone dan checkOptionalUrl', () => {
    expect(checkOptionalPhone('')).toBeUndefined();
    expect(checkOptionalPhone('123')).toMatch(/tidak valid/);
    expect(checkOptionalUrl('')).toBeUndefined();
    expect(checkOptionalUrl('contoh.com')).toMatch(/http/);
    expect(checkOptionalUrl('https://contoh.com')).toBeUndefined();
  });

  it('checkInteger', () => {
    const opts = { label: 'Kapasitas', ...LIMITS.CAPACITY };
    expect(checkInteger('', opts)).toBe('Kapasitas wajib diisi');
    expect(checkInteger(null, opts)).toBe('Kapasitas wajib diisi');
    expect(checkInteger('2.5', opts)).toMatch(/bilangan bulat/);
    expect(checkInteger(0, opts)).toMatch(/antara/);
    expect(checkInteger(51, opts)).toMatch(/antara/);
    expect(checkInteger(2, opts)).toBeUndefined();
  });
});
