import { describe, it, expect } from 'vitest';
import { LIMITS, checkEmail, checkOptionalPhone, checkOptionalUrl } from './rules.js';
import { validateBooking, validateRoom } from './forms.js';

describe('cabang validasi yang jarang tersentuh', () => {
  it('checkEmail: terlalu panjang memakai label kustom', () => {
    const long = `${'a'.repeat(LIMITS.EMAIL_MAX)}@x.id`;
    expect(checkEmail(long, 'Surel')).toBe(`Surel maksimal ${LIMITS.EMAIL_MAX} karakter`);
  });

  it('checkOptionalPhone: nomor valid lolos', () => {
    expect(checkOptionalPhone('+62 812-3456-7890')).toBeUndefined();
  });

  it('checkOptionalPhone: pesan memakai label kustom', () => {
    expect(checkOptionalPhone('abc', 'WhatsApp')).toMatch(/^WhatsApp tidak valid/);
  });

  it('checkOptionalUrl: terlalu panjang memakai label kustom', () => {
    const long = `https://example.com/${'a'.repeat(LIMITS.URL_MAX)}`;
    expect(checkOptionalUrl(long, 'Gambar')).toBe(`Gambar maksimal ${LIMITS.URL_MAX} karakter`);
  });

  it('validateRoom: homestay_id < 1 tidak valid', () => {
    const { errors } = validateRoom({ homestay_id: '0' });
    expect(errors.homestay_id).toBe('Homestay tidak valid');
  });

  it('validateBooking: check-out bukan tanggal kalender yang valid', () => {
    const { errors } = validateBooking({ check_in: '2026-01-10', check_out: '2026-02-31' });
    expect(errors.check_out).toBe('Tanggal check-out tidak valid');
  });
});
