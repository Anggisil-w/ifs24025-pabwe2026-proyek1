// Proxy API same-origin: satu-satunya jalan bagi browser untuk memanggil backend.
// Token sesi dibaca dari cookie httpOnly (event.locals.token) lalu ditempelkan di sini, di server,
// sehingga JavaScript di browser tidak pernah melihat token. Aturan murninya ada di lib/server/api-proxy-rules.js.
import { json } from '@sveltejs/kit';
import { BACKEND_API_URL } from '#lib/api';
import {
  MAX_BODY_BYTES,
  UPSTREAM_TIMEOUT_MS,
  errorBody,
  isAllowedApiPath,
  isTrustedOrigin
} from '#lib/server/api-proxy-rules';

const jsonError = (status, message) => json({ error: { message, details: [] } }, { status });

async function forward({ request, params, url, locals, fetch }) {
  if (!isAllowedApiPath(params.path)) return jsonError(404, 'Endpoint tidak ditemukan');
  if (!isTrustedOrigin(request.method, request.headers.get('origin'), url.origin)) {
    return jsonError(403, 'Permintaan ditolak karena berasal dari situs lain');
  }

  const hasBody = request.method !== 'GET';
  const body = hasBody ? await request.text() : undefined;
  if (body !== undefined && new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return jsonError(413, 'Data yang dikirim terlalu besar');
  }

  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (locals.token) headers.Authorization = `Bearer ${locals.token}`;

  let upstream;
  try {
    upstream = await fetch(`${BACKEND_API_URL}/${params.path}${url.search}`, {
      method: request.method,
      headers,
      body: body || undefined,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
  } catch {
    return new Response(errorBody('Tidak dapat terhubung ke server API. Coba lagi beberapa saat lagi.'), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (upstream.status === 204) return new Response(null, { status: 204 });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' }
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
