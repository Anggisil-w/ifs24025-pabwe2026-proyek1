// Klien API terpusat: semua pemanggilan ke backend lewat file ini agar penanganan error seragam.
// Konstanta status ada di constants.js, helper format di format.js.
//
// Dua jalur, dipilih otomatis:
//  - Server (loader/action SvelteKit): langsung ke backend, token sesi dikirim lewat options.token
//    (diambil dari cookie httpOnly oleh lib/server/auth/session.js -> apiOptions(event)).
//  - Browser (form/tombol di komponen): ke /api/* di domain yang sama. Proxy server (routes/api) menambahkan
//    token dari cookie, jadi browser TIDAK pernah memegang token (tidak ada localStorage, tidak ada variabel global).
import * as publicEnv from '$env/static/public';
import { browser } from '$app/environment';

// Base URL dibaca saat build ($env/static/public): di Vercel env dynamic tidak sampai ke server.
// Ganti PUBLIC_API_BASE_URL -> redeploy.
// Fallback: saat development lokal -> localhost; saat build produksi -> backend Railway.
const FALLBACK_API_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : 'https://ifs24025-pabwe2026-proyek1-backend-production.up.railway.app/api';

// Alamat backend sebenarnya (hanya dipakai di server)
export const BACKEND_API_URL = (publicEnv.PUBLIC_API_BASE_URL || FALLBACK_API_URL).replace(/\/+$/, '');

// Alamat proxy same-origin yang dipakai browser
export const BROWSER_API_PATH = '/api';

const baseUrl = () => (browser ? BROWSER_API_PATH : BACKEND_API_URL);

// ---------- Error ----------

// Error dari backend: { error: { message, details } } atau kegagalan jaringan (status 0)
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Mengubah error apa pun menjadi objek biasa { status, message, details }.
// Objek biasa aman dikirim dari server ke browser (serialisasi data load) dan mudah ditampilkan.
export function toErrorInfo(err) {
  if (err instanceof ApiError) {
    return { status: err.status, message: err.message, details: err.details };
  }
  return { status: 0, message: err?.message || 'Terjadi kesalahan yang tidak terduga', details: [] };
}

// ---------- Fetch wrapper ----------

// options.fetch: isi dengan fetch milik SvelteKit saat dipanggil dari fungsi load
async function request(path, { method = 'GET', body, query, token, fetch: fetchFn = globalThis.fetch } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const queryString = params.toString();
  const url = `${baseUrl()}${path}${queryString ? `?${queryString}` : ''}`;

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // Di browser token tidak pernah ada; cookie httpOnly dikirim otomatis ke proxy /api
  if (token && !browser) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetchFn(url, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(
      0,
      browser
        ? 'Tidak dapat terhubung ke server. Periksa koneksi internetmu lalu coba lagi.'
        : `Tidak dapat terhubung ke server API (${BACKEND_API_URL}). Pastikan backend sudah berjalan.`
    );
  }

  // 204 No Content (hasil DELETE) tidak punya body
  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? `Permintaan gagal (HTTP ${response.status})`,
      payload?.error?.details ?? []
    );
  }
  return payload;
}

// Backend membungkus hasil dalam { data: ... }; fungsi ini juga menerima respons tanpa pembungkus
const unwrap = (payload) =>
  payload !== null && typeof payload === 'object' && 'data' in payload ? payload.data : payload;

// is_active bisa berupa boolean atau 0/1; UI selalu memakai boolean
const normalizeRoom = (room) => ({ ...room, is_active: room.is_active === true || room.is_active === 1 });

// Mendukung { pagination: { totalPages } } maupun { meta: { total_pages } }
function normalizePagination(payload, fallbackPage, fallbackLimit, itemCount) {
  const raw = payload?.pagination ?? payload?.meta ?? {};
  const total = Number(raw.total ?? itemCount);
  const limit = Number(raw.limit ?? fallbackLimit);
  return {
    page: Number(raw.page ?? fallbackPage),
    limit,
    total,
    totalPages: Number(raw.totalPages ?? raw.total_pages ?? Math.max(1, Math.ceil(total / limit)))
  };
}

// ---------- Auth ----------

// Mengembalikan { token, user }
export async function register(data, options = {}) {
  return unwrap(await request('/auth/register', { ...options, method: 'POST', body: data }));
}

// Mengembalikan { token, user }
export async function login(data, options = {}) {
  return unwrap(await request('/auth/login', { ...options, method: 'POST', body: data }));
}

// Mengembalikan user ({ id, name, email, role }) atau melempar ApiError 401 jika token tidak valid
export async function fetchCurrentUser(token, options = {}) {
  return unwrap(await request('/auth/me', { ...options, token })).user;
}

// ---------- Homestays ----------

export async function listHomestays(params = {}, options = {}) {
  const payload = await request('/homestays', { ...options, query: params });
  const items = unwrap(payload) ?? [];
  return {
    items,
    pagination: normalizePagination(payload, params.page ?? 1, params.limit ?? 10, items.length)
  };
}

// Mengambil seluruh homestay (backend membatasi limit maksimal 50 per halaman, jadi diulang per halaman)
export async function listAllHomestays(options = {}) {
  const all = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await listHomestays({ page, limit: 50 }, options);
    all.push(...result.items);
    if (page >= result.pagination.totalPages) break;
  }
  return all;
}

export async function getHomestay(id, options = {}) {
  return unwrap(await request(`/homestays/${id}`, options));
}

export async function createHomestay(data, options = {}) {
  return unwrap(await request('/homestays', { ...options, method: 'POST', body: data }));
}

export async function updateHomestay(id, data, options = {}) {
  return unwrap(await request(`/homestays/${id}`, { ...options, method: 'PUT', body: data }));
}

export async function deleteHomestay(id, options = {}) {
  await request(`/homestays/${id}`, { ...options, method: 'DELETE' });
}

export async function getHomestayRooms(id, options = {}) {
  const rooms = unwrap(await request(`/homestays/${id}/rooms`, options)) ?? [];
  return rooms.map(normalizeRoom);
}

// ---------- Rooms ----------

export async function listRooms(params = {}, options = {}) {
  const rooms = unwrap(await request('/rooms', { ...options, query: params })) ?? [];
  return rooms.map(normalizeRoom);
}

export async function createRoom(data, options = {}) {
  return normalizeRoom(unwrap(await request('/rooms', { ...options, method: 'POST', body: data })));
}

export async function updateRoom(id, data, options = {}) {
  return normalizeRoom(unwrap(await request(`/rooms/${id}`, { ...options, method: 'PUT', body: data })));
}

export async function deleteRoom(id, options = {}) {
  await request(`/rooms/${id}`, { ...options, method: 'DELETE' });
}

// ---------- Bookings ----------

export async function listBookings(params = {}, options = {}) {
  return unwrap(await request('/bookings', { ...options, query: params })) ?? [];
}

export async function createBooking(data, options = {}) {
  return unwrap(await request('/bookings', { ...options, method: 'POST', body: data }));
}

export async function updateBookingStatus(id, status, options = {}) {
  return unwrap(await request(`/bookings/${id}/status`, { ...options, method: 'PATCH', body: { status } }));
}

export async function deleteBooking(id, options = {}) {
  await request(`/bookings/${id}`, { ...options, method: 'DELETE' });
}
