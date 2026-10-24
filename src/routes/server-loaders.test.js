import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(status, message, details = []) {
      super(message);
      this.status = status;
      this.details = details;
    }
  }
  return {
    ApiError,
    toErrorInfo: (err) => ({ status: err.status ?? 0, message: err.message, details: err.details ?? [] }),
    listHomestays: vi.fn(),
    listAllHomestays: vi.fn(),
    listRooms: vi.fn(),
    listBookings: vi.fn(),
    getHomestay: vi.fn(),
    getHomestayRooms: vi.fn(),
    login: vi.fn(),
    register: vi.fn()
  };
});
vi.mock('#lib/api', () => api);

import { load as rootLayoutLoad } from './+layout.server.js';
import { load as homeLoad } from './+page.server.js';
import { load as adminLayoutLoad } from './admin/+layout.server.js';
import { load as adminLoad } from './admin/+page.server.js';
import { load as bookingsLayoutLoad } from './bookings/+layout.server.js';
import { load as bookingsLoad } from './bookings/+page.server.js';
import { load as homestayLoad } from './homestays/[id]/+page.server.js';
import * as login from './login/+page.server.js';
import * as register from './register/+page.server.js';
import * as authLogin from './auth/login/+page.server.js';

function thrown(fn) {
  return Promise.resolve()
    .then(fn)
    .then(
      () => null,
      (e) => e
    );
}

const makeEvent = ({ user = null, path = '/', params = {} } = {}) => ({
  locals: { user, token: user ? 'tok' : null },
  url: new URL(`http://localhost${path}`),
  params,
  fetch: vi.fn()
});

const admin = { id: 1, role: 'admin' };
const guest = { id: 2, role: 'guest' };

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn?.mockReset === 'function') fn.mockReset();
});

describe('+layout.server', () => {
  it('menyediakan user dan tidak membocorkan token', () => {
    expect(rootLayoutLoad({ locals: { user: guest, token: 'rahasia' } })).toEqual({ user: guest });
  });
});

describe('halaman beranda', () => {
  it('memuat homestay, kota unik terurut, dan filter dari URL', async () => {
    api.listHomestays.mockResolvedValue({ items: [{ id: 1 }], pagination: { page: 2, limit: 3, total: 4, totalPages: 2 } });
    api.listAllHomestays.mockResolvedValue([{ city: 'Medan' }, { city: 'Balige' }, { city: 'Medan' }]);
    const data = await homeLoad(makeEvent({ path: '/?search=%20danau%20&city=Medan&page=2' }));
    expect(api.listHomestays).toHaveBeenCalledWith({ search: 'danau', city: 'Medan', page: 2, limit: 3 }, expect.any(Object));
    expect(data).toMatchObject({
      filters: { search: 'danau', city: 'Medan', page: 2 },
      homestays: [{ id: 1 }],
      cities: ['Balige', 'Medan'],
      loadError: null
    });
  });

  it('nomor halaman dibatasi dan nilai aneh jatuh ke 1', async () => {
    api.listHomestays.mockResolvedValue({ items: [], pagination: {} });
    api.listAllHomestays.mockResolvedValue([]);
    expect((await homeLoad(makeEvent({ path: '/?page=abc' }))).filters.page).toBe(1);
    expect((await homeLoad(makeEvent({ path: '/?page=-5' }))).filters.page).toBe(1);
    expect((await homeLoad(makeEvent({ path: '/?page=99999999' }))).filters.page).toBe(10000);
  });

  it('error API ditampilkan di dalam halaman', async () => {
    api.listHomestays.mockRejectedValue(new api.ApiError(503, 'mati'));
    api.listAllHomestays.mockResolvedValue([]);
    const data = await homeLoad(makeEvent());
    expect(data.loadError).toMatchObject({ status: 503, message: 'mati' });
    expect(data.homestays).toEqual([]);
    expect(data.pagination).toEqual({ page: 1, limit: 3, total: 0, totalPages: 1 });
  });
});

describe('/admin', () => {
  it('layout menolak anonim dan non-admin', () => {
    expect(() => adminLayoutLoad(makeEvent({ path: '/admin' }))).toThrow();
    expect(() => adminLayoutLoad(makeEvent({ user: guest, path: '/admin' }))).toThrow();
    expect(adminLayoutLoad(makeEvent({ user: admin, path: '/admin' }))).toBeUndefined();
  });

  it('halaman memuat homestay dan kamar', async () => {
    api.listAllHomestays.mockResolvedValue([{ id: 1 }]);
    api.listRooms.mockResolvedValue([{ id: 9 }]);
    expect(await adminLoad(makeEvent({ user: admin, path: '/admin' }))).toEqual({
      homestays: [{ id: 1 }],
      rooms: [{ id: 9 }],
      loadError: null
    });
  });

  it('halaman menampilkan loadError saat API gagal', async () => {
    api.listAllHomestays.mockRejectedValue(new api.ApiError(500, 'gagal'));
    api.listRooms.mockResolvedValue([]);
    const data = await adminLoad(makeEvent({ user: admin, path: '/admin' }));
    expect(data.loadError.status).toBe(500);
    expect(data.homestays).toEqual([]);
  });

  it('non-admin ditolak di loader halaman', async () => {
    const e = await thrown(() => adminLoad(makeEvent({ user: guest, path: '/admin' })));
    expect(e.status).toBe(403);
  });
});

describe('/bookings', () => {
  it('layout mewajibkan login', () => {
    const e = (() => {
      try {
        bookingsLayoutLoad(makeEvent({ path: '/bookings' }));
      } catch (err) {
        return err;
      }
    })();
    expect(e.status).toBe(303);
    expect(bookingsLayoutLoad(makeEvent({ user: guest, path: '/bookings' }))).toBeUndefined();
  });

  it('memuat pesanan dengan filter status yang valid', async () => {
    api.listBookings.mockResolvedValue([{ id: 1 }]);
    const data = await bookingsLoad(makeEvent({ user: guest, path: '/bookings?status=pending' }));
    expect(api.listBookings).toHaveBeenCalledWith({ status: 'pending' }, expect.any(Object));
    expect(data).toEqual({ status: 'pending', bookings: [{ id: 1 }], loadError: null });
  });

  it('status di luar daftar diabaikan', async () => {
    api.listBookings.mockResolvedValue([]);
    const data = await bookingsLoad(makeEvent({ user: guest, path: '/bookings?status=hacker' }));
    expect(data.status).toBe('');
  });

  it('error API menjadi loadError', async () => {
    api.listBookings.mockRejectedValue(new api.ApiError(500, 'gagal'));
    const data = await bookingsLoad(makeEvent({ user: guest, path: '/bookings' }));
    expect(data.bookings).toEqual([]);
    expect(data.loadError.message).toBe('gagal');
  });

  it('anonim dialihkan ke login', async () => {
    const e = await thrown(() => bookingsLoad(makeEvent({ path: '/bookings' })));
    expect(e.status).toBe(303);
  });
});

describe('/homestays/[id]', () => {
  it('memuat homestay beserta kamarnya', async () => {
    api.getHomestay.mockResolvedValue({ id: 3 });
    api.getHomestayRooms.mockResolvedValue([{ id: 1 }]);
    expect(await homestayLoad(makeEvent({ params: { id: '3' } }))).toEqual({ homestay: { id: 3 }, rooms: [{ id: 1 }] });
  });

  it.each([
    [400, 404],
    [404, 404],
    [403, 403],
    [500, 500],
    [0, 503]
  ])('ApiError %i menjadi halaman error %i', async (from, to) => {
    api.getHomestay.mockRejectedValue(new api.ApiError(from, 'x'));
    api.getHomestayRooms.mockResolvedValue([]);
    const e = await thrown(() => homestayLoad(makeEvent({ params: { id: '3' } })));
    expect(e.status).toBe(to);
  });

  it('error selain ApiError dilempar ulang', async () => {
    const boom = new Error('bug');
    api.getHomestay.mockRejectedValue(boom);
    api.getHomestayRooms.mockResolvedValue([]);
    expect(await thrown(() => homestayLoad(makeEvent({ params: { id: '3' } })))).toBe(boom);
  });
});

function formEvent(fields, { path = '/login' } = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  const cookies = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
  return { request: { formData: async () => fd }, cookies, url: new URL(`http://localhost${path}`), fetch: vi.fn(), cookies_: cookies };
}

describe('aksi login', () => {
  const valid = { email: 'Budi@Example.com', password: 'Rahasia123!', next: '/bookings' };

  it('load mengalihkan pengguna yang sudah login dan menyiapkan next untuk tamu', () => {
    expect(login.load(makeEvent({ path: '/login?next=/bookings' }))).toEqual({ next: '/bookings' });
    expect(() => login.load(makeEvent({ user: guest, path: '/login' }))).toThrow();
  });

  it('data tidak valid: 400 beserta detail, password tidak dikembalikan', async () => {
    const out = await login.actions.default(formEvent({ email: 'bukan-email', password: '' }));
    expect(out.status).toBe(400);
    expect(out.data.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['email', 'password']));
    expect(out.data).not.toHaveProperty('password');
    expect(api.login).not.toHaveBeenCalled();
  });

  it('berhasil: set cookie lalu redirect ke next', async () => {
    api.login.mockResolvedValue({ token: 'jwt' });
    const event = formEvent(valid);
    const e = await thrown(() => login.actions.default(event));
    expect(e.status).toBe(303);
    expect(e.location).toBe('/bookings');
    expect(api.login).toHaveBeenCalledWith({ email: 'budi@example.com', password: 'Rahasia123!' }, { fetch: event.fetch });
    expect(event.cookies.set).toHaveBeenCalledWith('mj_token', 'jwt', expect.objectContaining({ httpOnly: true }));
  });

  it('next berbahaya diganti ke /', async () => {
    api.login.mockResolvedValue({ token: 'jwt' });
    const e = await thrown(() => login.actions.default(formEvent({ ...valid, next: '//evil.com' })));
    expect(e.location).toBe('/');
  });

  it('kredensial salah: status dari backend', async () => {
    api.login.mockRejectedValue(new api.ApiError(401, 'Email atau password salah'));
    const out = await login.actions.default(formEvent(valid));
    expect(out.status).toBe(401);
    expect(out.data.email).toBe('budi@example.com');
    expect(out.data.error.message).toBe('Email atau password salah');
  });

  it('backend mati (status 0): 503', async () => {
    api.login.mockRejectedValue(new api.ApiError(0, 'offline'));
    expect((await login.actions.default(formEvent(valid))).status).toBe(503);
  });

  it('/auth/login memakai load dan actions yang sama', () => {
    expect(authLogin.load).toBe(login.load);
    expect(authLogin.actions).toBe(login.actions);
  });
});

describe('aksi register', () => {
  const valid = { name: 'Budi Santoso', email: 'Budi@Example.com', password: 'Rahasia123!', confirm: 'Rahasia123!', next: '/' };

  it('load mengikuti redirectIfAuthenticated', () => {
    expect(register.load(makeEvent({ path: '/register' }))).toEqual({ next: '/' });
    expect(() => register.load(makeEvent({ user: guest, path: '/register' }))).toThrow();
  });

  it('password tidak cocok: 400 dan form tetap terisi tanpa password', async () => {
    const out = await register.actions.default(formEvent({ ...valid, confirm: 'beda' }, { path: '/register' }));
    expect(out.status).toBe(400);
    expect(out.data.name).toBe('Budi Santoso');
    expect(out.data.email).toBe('budi@example.com');
    expect(out.data.error.details.some((d) => d.field === 'confirm')).toBe(true);
    expect(out.data).not.toHaveProperty('password');
    expect(api.register).not.toHaveBeenCalled();
  });

  it('berhasil: langsung login dan redirect', async () => {
    api.register.mockResolvedValue({ token: 'jwt' });
    const event = formEvent({ ...valid, next: '/bookings' }, { path: '/register' });
    const e = await thrown(() => register.actions.default(event));
    expect(e.status).toBe(303);
    expect(e.location).toBe('/bookings');
    expect(api.register).toHaveBeenCalledWith(
      { name: 'Budi Santoso', email: 'budi@example.com', password: 'Rahasia123!' },
      { fetch: event.fetch }
    );
    expect(event.cookies.set).toHaveBeenCalledWith('mj_token', 'jwt', expect.any(Object));
  });

  it('email sudah terdaftar: status 409 dari backend', async () => {
    api.register.mockRejectedValue(new api.ApiError(409, 'Email sudah terdaftar'));
    const out = await register.actions.default(formEvent(valid, { path: '/register' }));
    expect(out.status).toBe(409);
    expect(out.data.error.message).toBe('Email sudah terdaftar');
  });

  it('backend mati: 503', async () => {
    api.register.mockRejectedValue(new api.ApiError(0, 'offline'));
    expect((await register.actions.default(formEvent(valid, { path: '/register' }))).status).toBe(503);
  });
});
