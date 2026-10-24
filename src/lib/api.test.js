import { describe, it, expect, vi, beforeEach } from 'vitest';

const env = vi.hoisted(() => ({ browser: false }));

vi.mock('$app/environment', () => ({
  get browser() {
    return env.browser;
  }
}));
vi.mock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: 'http://api.test/api///' }));

import * as api from './api.js';

function res(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (body === undefined) throw new Error('bukan JSON');
      return body;
    }
  };
}

let fetchFn;
beforeEach(() => {
  env.browser = false;
  fetchFn = vi.fn();
});

const lastCall = () => fetchFn.mock.calls.at(-1);

describe('ApiError dan toErrorInfo', () => {
  it('ApiError menyimpan status, pesan, dan details', () => {
    const err = new api.ApiError(422, 'Tidak valid', [{ field: 'x' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(422);
    expect(err.details).toEqual([{ field: 'x' }]);
    expect(new api.ApiError(500, 'x').details).toEqual([]);
  });

  it('mengubah ApiError menjadi objek biasa', () => {
    expect(api.toErrorInfo(new api.ApiError(409, 'Bentrok', [1]))).toEqual({ status: 409, message: 'Bentrok', details: [1] });
  });

  it('mengubah error biasa dan nilai kosong menjadi status 0', () => {
    expect(api.toErrorInfo(new Error('boom'))).toEqual({ status: 0, message: 'boom', details: [] });
    expect(api.toErrorInfo(null).message).toBe('Terjadi kesalahan yang tidak terduga');
    expect(api.toErrorInfo(undefined).status).toBe(0);
  });
});

describe('alamat dasar', () => {
  it('menghapus garis miring di akhir BACKEND_API_URL', () => {
    expect(api.BACKEND_API_URL).toBe('http://api.test/api');
    expect(api.BROWSER_API_PATH).toBe('/api');
  });

  it('memakai alamat lokal saat PUBLIC_API_BASE_URL kosong (mode dev)', async () => {
    vi.resetModules();
    vi.doMock('$app/environment', () => ({ browser: false }));
    vi.doMock('$env/static/public', () => ({ PUBLIC_API_BASE_URL: '' }));
    const fresh = await import('./api.js');
    expect(fresh.BACKEND_API_URL).toBe('http://localhost:3000/api');
    vi.doUnmock('$env/static/public');
    vi.doUnmock('$app/environment');
  });
});

describe('request: URL, header, dan body', () => {
  it('di server memakai backend langsung dan mengirim token Bearer', async () => {
    fetchFn.mockResolvedValue(res(200, { data: { user: { id: 1 } } }));
    const user = await api.fetchCurrentUser('abc', { fetch: fetchFn });
    expect(user).toEqual({ id: 1 });
    const [url, init] = lastCall();
    expect(url).toBe('http://api.test/api/auth/me');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ Authorization: 'Bearer abc' });
    expect(init.body).toBeUndefined();
  });

  it('di browser memakai proxy /api dan tidak mengirim token', async () => {
    env.browser = true;
    fetchFn.mockResolvedValue(res(200, { data: { user: { id: 1 } } }));
    await api.fetchCurrentUser('abc', { fetch: fetchFn });
    const [url, init] = lastCall();
    expect(url).toBe('/api/auth/me');
    expect(init.headers).toBeUndefined();
  });

  it('mengirim body JSON dengan Content-Type', async () => {
    fetchFn.mockResolvedValue(res(200, { data: { token: 't', user: {} } }));
    const out = await api.login({ email: 'a@b.c', password: 'x' }, { fetch: fetchFn });
    expect(out).toEqual({ token: 't', user: {} });
    const [url, init] = lastCall();
    expect(url).toBe('http://api.test/api/auth/login');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.c', password: 'x' });
  });

  it('register memanggil /auth/register', async () => {
    fetchFn.mockResolvedValue(res(201, { data: { token: 't' } }));
    await api.register({ name: 'A' }, { fetch: fetchFn });
    expect(lastCall()[0]).toContain('/auth/register');
    expect(lastCall()[1].method).toBe('POST');
  });

  it('melewatkan query kosong, null, dan undefined', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [] }));
    await api.listRooms({ a: 1, b: '', c: null, d: undefined, e: 'x y' }, { fetch: fetchFn });
    expect(lastCall()[0]).toBe('http://api.test/api/rooms?a=1&e=x+y');
  });

  it('tanpa query tidak menambahkan tanda tanya', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [] }));
    await api.listRooms({}, { fetch: fetchFn });
    expect(lastCall()[0]).toBe('http://api.test/api/rooms');
  });
});

describe('request: penanganan respons', () => {
  it('204 mengembalikan null (DELETE)', async () => {
    fetchFn.mockResolvedValue(res(204));
    await expect(api.deleteHomestay(5, { fetch: fetchFn })).resolves.toBeUndefined();
    expect(lastCall()[0]).toBe('http://api.test/api/homestays/5');
    expect(lastCall()[1].method).toBe('DELETE');
  });

  it('respons tanpa pembungkus data tetap diterima', async () => {
    fetchFn.mockResolvedValue(res(200, { id: 7, name: 'Rumah' }));
    expect(await api.getHomestay(7, { fetch: fetchFn })).toEqual({ id: 7, name: 'Rumah' });
  });

  it('payload null dikembalikan apa adanya', async () => {
    fetchFn.mockResolvedValue(res(200, null));
    expect(await api.getHomestay(7, { fetch: fetchFn })).toBeNull();
  });

  it('respons error memakai pesan dan details dari backend', async () => {
    fetchFn.mockResolvedValue(res(422, { error: { message: 'Data salah', details: [{ field: 'name', message: 'wajib' }] } }));
    const err = await api.createHomestay({}, { fetch: fetchFn }).catch((e) => e);
    expect(err).toBeInstanceOf(api.ApiError);
    expect(err.status).toBe(422);
    expect(err.message).toBe('Data salah');
    expect(err.details).toHaveLength(1);
  });

  it('respons error non-JSON memakai pesan bawaan', async () => {
    fetchFn.mockResolvedValue(res(502));
    const err = await api.getHomestay(1, { fetch: fetchFn }).catch((e) => e);
    expect(err.status).toBe(502);
    expect(err.message).toBe('Permintaan gagal (HTTP 502)');
    expect(err.details).toEqual([]);
  });

  it('kegagalan jaringan di server menyebut alamat backend', async () => {
    fetchFn.mockRejectedValue(new TypeError('fetch failed'));
    const err = await api.getHomestay(1, { fetch: fetchFn }).catch((e) => e);
    expect(err.status).toBe(0);
    expect(err.message).toContain('http://api.test/api');
  });

  it('kegagalan jaringan di browser memberi pesan koneksi internet', async () => {
    env.browser = true;
    fetchFn.mockRejectedValue(new TypeError('fetch failed'));
    const err = await api.getHomestay(1, { fetch: fetchFn }).catch((e) => e);
    expect(err.status).toBe(0);
    expect(err.message).toContain('koneksi internet');
  });
});

describe('homestay', () => {
  it('listHomestays membaca pagination dari objek pagination', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1 }], pagination: { page: 2, limit: 3, total: 7, totalPages: 3 } }));
    const out = await api.listHomestays({ page: 2, limit: 3 }, { fetch: fetchFn });
    expect(out.items).toEqual([{ id: 1 }]);
    expect(out.pagination).toEqual({ page: 2, limit: 3, total: 7, totalPages: 3 });
  });

  it('listHomestays membaca pagination dari meta (snake_case)', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [], meta: { page: 1, limit: 10, total: 25, total_pages: 3 } }));
    const out = await api.listHomestays({}, { fetch: fetchFn });
    expect(out.pagination.totalPages).toBe(3);
  });

  it('listHomestays menghitung pagination sendiri bila backend tidak mengirim', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1 }, { id: 2 }, { id: 3 }] }));
    const out = await api.listHomestays({ page: 1, limit: 2 }, { fetch: fetchFn });
    expect(out.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('listHomestays menganggap data kosong sebagai daftar kosong', async () => {
    fetchFn.mockResolvedValue(res(200, { data: null }));
    const out = await api.listHomestays({}, { fetch: fetchFn });
    expect(out.items).toEqual([]);
    expect(out.pagination.totalPages).toBe(1);
  });

  it('listAllHomestays mengulang per halaman sampai halaman terakhir', async () => {
    fetchFn
      .mockResolvedValueOnce(res(200, { data: [{ id: 1 }], pagination: { totalPages: 2 } }))
      .mockResolvedValueOnce(res(200, { data: [{ id: 2 }], pagination: { totalPages: 2 } }));
    const all = await api.listAllHomestays({ fetch: fetchFn });
    expect(all.map((h) => h.id)).toEqual([1, 2]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[1][0]).toContain('page=2');
    expect(fetchFn.mock.calls[1][0]).toContain('limit=50');
  });

  it('listAllHomestays berhenti di batas 20 halaman', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1 }], pagination: { totalPages: 999 } }));
    const all = await api.listAllHomestays({ fetch: fetchFn });
    expect(fetchFn).toHaveBeenCalledTimes(20);
    expect(all).toHaveLength(20);
  });

  it('create, update, dan getHomestayRooms memakai method dan path yang benar', async () => {
    fetchFn.mockResolvedValue(res(200, { data: { id: 1 } }));
    await api.createHomestay({ name: 'A' }, { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/homestays', 'POST']);
    await api.updateHomestay(1, { name: 'B' }, { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/homestays/1', 'PUT']);

    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1, is_active: 1 }, { id: 2, is_active: 0 }, { id: 3, is_active: true }] }));
    const rooms = await api.getHomestayRooms(1, { fetch: fetchFn });
    expect(lastCall()[0]).toBe('http://api.test/api/homestays/1/rooms');
    expect(rooms.map((r) => r.is_active)).toEqual([true, false, true]);

    fetchFn.mockResolvedValue(res(200, { data: null }));
    expect(await api.getHomestayRooms(1, { fetch: fetchFn })).toEqual([]);
  });
});

describe('kamar', () => {
  it('listRooms menormalkan is_active dan menangani data kosong', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1, is_active: 1 }, { id: 2, is_active: false }] }));
    expect((await api.listRooms({}, { fetch: fetchFn })).map((r) => r.is_active)).toEqual([true, false]);
    fetchFn.mockResolvedValue(res(200, { data: null }));
    expect(await api.listRooms({}, { fetch: fetchFn })).toEqual([]);
  });

  it('createRoom, updateRoom, dan deleteRoom', async () => {
    fetchFn.mockResolvedValue(res(200, { data: { id: 1, is_active: 1 } }));
    expect((await api.createRoom({ name: 'K' }, { fetch: fetchFn })).is_active).toBe(true);
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/rooms', 'POST']);
    expect((await api.updateRoom(1, { name: 'K2' }, { fetch: fetchFn })).is_active).toBe(true);
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/rooms/1', 'PUT']);
    fetchFn.mockResolvedValue(res(204));
    await api.deleteRoom(1, { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/rooms/1', 'DELETE']);
  });
});

describe('pemesanan', () => {
  it('listBookings mengirim filter dan menangani data kosong', async () => {
    fetchFn.mockResolvedValue(res(200, { data: [{ id: 1 }] }));
    expect(await api.listBookings({ status: 'pending' }, { fetch: fetchFn })).toEqual([{ id: 1 }]);
    expect(lastCall()[0]).toBe('http://api.test/api/bookings?status=pending');
    fetchFn.mockResolvedValue(res(200, { data: null }));
    expect(await api.listBookings({}, { fetch: fetchFn })).toEqual([]);
  });

  it('createBooking, updateBookingStatus, dan deleteBooking', async () => {
    fetchFn.mockResolvedValue(res(200, { data: { id: 1 } }));
    await api.createBooking({ room_id: 1 }, { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/bookings', 'POST']);
    await api.updateBookingStatus(1, 'confirmed', { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/bookings/1/status', 'PATCH']);
    expect(JSON.parse(lastCall()[1].body)).toEqual({ status: 'confirmed' });
    fetchFn.mockResolvedValue(res(204));
    await api.deleteBooking(1, { fetch: fetchFn });
    expect([lastCall()[0], lastCall()[1].method]).toEqual(['http://api.test/api/bookings/1', 'DELETE']);
  });
});
