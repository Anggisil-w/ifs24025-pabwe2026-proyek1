import { describe, it, expect } from 'vitest';
import { loginPath, safeNext, withNext } from './redirect.js';

describe('safeNext', () => {
  it('menerima path internal', () => {
    for (const ok of ['/', '/bookings', '/bookings?status=pending', '/homestays/3#kamar']) expect(safeNext(ok)).toBe(ok);
  });

  it('menolak open redirect dan trik pengelabuan', () => {
    const bad = [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      'http://evil.com',
      'javascript:alert(1)',
      'evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/ /evil.com',
      '',
      null,
      undefined,
      42,
      ['/bookings'],
      `/${'a'.repeat(3000)}`
    ];
    for (const value of bad) expect(safeNext(value), String(value)).toBe('/');
  });

  it('memakai fallback yang diberikan', () => {
    expect(safeNext('//evil.com', '/bookings')).toBe('/bookings');
  });
});

describe('loginPath dan withNext', () => {
  it('menyertakan tujuan yang di-encode', () => {
    expect(loginPath('/bookings?status=pending')).toBe('/login?next=%2Fbookings%3Fstatus%3Dpending');
  });

  it('tujuan tidak aman atau beranda -> /login polos', () => {
    expect(loginPath('//evil.com')).toBe('/login');
    expect(loginPath('/')).toBe('/login');
    expect(loginPath()).toBe('/login');
  });

  it('withNext mempertahankan tujuan antar halaman login/register', () => {
    expect(withNext('/register', '/admin')).toBe('/register?next=%2Fadmin');
    expect(withNext('/register', '/')).toBe('/register');
    expect(withNext('/register', 'https://evil.com')).toBe('/register');
  });
});
