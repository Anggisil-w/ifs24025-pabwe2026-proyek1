import { describe, it, expect } from 'vitest';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateBooking,
  validateHomestay,
  validateLogin,
  validateRegister,
  validateRoom
} from './forms.js';

describe('validateLogin', () => {
  it('valid -> data dinormalisasi', () => {
    const result = validateLogin({ email: '  A@B.CO ', password: 'x' });
    expect(result).toEqual({ valid: true, errors: {}, data: { email: 'a@b.co', password: 'x' } });
  });

  it('melaporkan email dan password bermasalah', () => {
    expect(validateLogin({ email: '', password: '' }).errors).toEqual({
      email: 'Email wajib diisi',
      password: 'Password wajib diisi'
    });
    expect(validateLogin({ email: 'salah', password: 'x' }).errors.email).toBe('Format email tidak valid');
    expect(validateLogin({ email: 'a@b.co', password: 'x'.repeat(PASSWORD_MAX_LENGTH + 1) }).errors.password).toMatch(/maksimal/);
  });

  it('tahan terhadap input null/undefined', () => {
    expect(validateLogin().valid).toBe(false);
    expect(validateLogin({ email: null, password: null }).valid).toBe(false);
  });
});

describe('validateRegister', () => {
  const pass = 'a'.repeat(PASSWORD_MIN_LENGTH);
  const valid = { name: ' Budi ', email: 'Budi@Contoh.com', password: pass, confirm: pass };

  it('valid -> data tanpa field confirm', () => {
    const result = validateRegister(valid);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ name: 'Budi', email: 'budi@contoh.com', password: pass });
  });

  it('menolak nama pendek atau tanpa huruf', () => {
    expect(validateRegister({ ...valid, name: 'B' }).errors.name).toBeDefined();
    expect(validateRegister({ ...valid, name: '1234' }).errors.name).toBe('Nama harus mengandung huruf');
  });

  it('menolak password pendek, terlalu panjang, hanya spasi, dan tidak cocok', () => {
    expect(validateRegister({ ...valid, password: 'abc', confirm: 'abc' }).errors.password).toMatch(/minimal/);
    const long = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validateRegister({ ...valid, password: long, confirm: long }).errors.password).toMatch(/maksimal/);
    const blanks = ' '.repeat(PASSWORD_MIN_LENGTH);
    expect(validateRegister({ ...valid, password: blanks, confirm: blanks }).errors.password).toMatch(/spasi/);
    expect(validateRegister({ ...valid, confirm: 'beda-sekali' }).errors.confirm).toBe('Password tidak cocok');
  });
});

describe('validateHomestay', () => {
  const valid = { name: ' Homestay Toba ', city: 'Parapat', address: 'Jl. Pelabuhan 12', phone: '', image_url: '', description: '' };

  it('valid -> kolom opsional kosong menjadi null', () => {
    const result = validateHomestay(valid);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      name: 'Homestay Toba',
      city: 'Parapat',
      address: 'Jl. Pelabuhan 12',
      phone: null,
      image_url: null,
      description: null
    });
  });

  it('menolak data yang melanggar batas backend', () => {
    const { errors } = validateHomestay({
      name: 'ab',
      city: '',
      address: 'x'.repeat(201),
      phone: '12',
      image_url: 'javascript:alert(1)',
      description: 'x'.repeat(2001)
    });
    expect(Object.keys(errors).sort()).toEqual(['address', 'city', 'description', 'image_url', 'name', 'phone']);
  });
});

describe('validateRoom', () => {
  const valid = { homestay_id: '3', name: 'Kamar Danau', type: 'standard', capacity: 2, price_per_night: '250000', description: ' ', is_active: true };

  it('valid -> angka dikonversi dan deskripsi kosong menjadi null', () => {
    const result = validateRoom(valid);
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      homestay_id: 3,
      name: 'Kamar Danau',
      type: 'standard',
      capacity: 2,
      price_per_night: 250000,
      description: null,
      is_active: true
    });
  });

  it('menolak angka di luar batas, desimal, dan homestay kosong', () => {
    const { errors } = validateRoom({ ...valid, homestay_id: '', capacity: 51, price_per_night: '1.5e3' });
    expect(errors.homestay_id).toBeDefined();
    expect(errors.capacity).toBeDefined();
    expect(errors.price_per_night).toMatch(/bilangan bulat/);
    expect(validateRoom({ ...valid, price_per_night: 100_000_001 }).errors.price_per_night).toBeDefined();
    expect(validateRoom({ ...valid, price_per_night: -1 }).errors.price_per_night).toBeDefined();
  });

  it('is_active=false dipertahankan', () => {
    expect(validateRoom({ ...valid, is_active: false }).data.is_active).toBe(false);
  });
});

describe('validateBooking', () => {
  const room = { id: 7, capacity: 3 };
  const today = '2026-10-24';
  const valid = {
    guest_name: 'Budi',
    guest_email: 'Budi@Contoh.com',
    guest_phone: '',
    guests_count: 2,
    check_in: '2026-11-01',
    check_out: '2026-11-03'
  };

  it('valid -> payload tanpa total_price', () => {
    const result = validateBooking(valid, { room, today });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      room_id: 7,
      guest_name: 'Budi',
      guest_email: 'budi@contoh.com',
      guest_phone: null,
      guests_count: 2,
      check_in: '2026-11-01',
      check_out: '2026-11-03'
    });
    expect('total_price' in result.data).toBe(false);
  });

  it('kamar wajib dipilih dan kapasitas ditegakkan', () => {
    expect(validateBooking(valid, { today }).errors.room).toBeDefined();
    expect(validateBooking({ ...valid, guests_count: 4 }, { room, today }).errors.guests_count).toMatch(/maksimal 3/);
    expect(validateBooking({ ...valid, guests_count: 0 }, { room, today }).errors.guests_count).toBeDefined();
    expect(validateBooking({ ...valid, guests_count: '1.5' }, { room, today }).errors.guests_count).toBeDefined();
  });

  it('tanggal: wajib, nyata di kalender, tidak di masa lalu, check-out setelah check-in', () => {
    const run = (patch) => validateBooking({ ...valid, ...patch }, { room, today }).errors;
    expect(run({ check_in: '' }).check_in).toMatch(/wajib/);
    expect(run({ check_in: '2026-02-31' }).check_in).toMatch(/tidak valid/);
    expect(run({ check_in: '2026-10-23' }).check_in).toMatch(/sebelum hari ini/);
    expect(run({ check_in: today, check_out: '2026-10-25' })).toEqual({});
    expect(run({ check_out: '' }).check_out).toMatch(/wajib/);
    expect(run({ check_out: '2026-11-01' }).check_out).toMatch(/setelah check-in/);
    expect(run({ check_out: '2026-10-30' }).check_out).toMatch(/setelah check-in/);
  });

  it('tidak menumpuk error check-out jika check-in sudah salah', () => {
    const { errors } = validateBooking({ ...valid, check_in: '2026-02-31', check_out: '2026-01-01' }, { room, today });
    expect(errors.check_in).toBeDefined();
    expect(errors.check_out).toBeUndefined();
  });
});
