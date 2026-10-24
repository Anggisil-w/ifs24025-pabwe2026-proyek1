import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#lib/api', () => ({ BACKEND_API_URL: 'http://backend.test/api' }));

import { GET, POST, PUT, PATCH, DELETE } from './+server.js';

const ORIGIN = 'http://localhost:5173';

function makeArgs({ method = 'GET', path = 'homestays', origin = null, body, token = null, search = '' } = {}) {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return {
    request: new Request(`${ORIGIN}/api/${path}${search}`, { method, headers, body }),
    params: { path },
    url: new URL(`${ORIGIN}/api/${path}${search}`),
    locals: { token },
    fetch: vi.fn()
  };
}

const upstreamResponse = (body, init = {}) =>
  new Response(body, { status: 200, headers: { 'content-type': 'application/json' }, ...init });

let args;
beforeEach(() => {
  args = null;
});

describe('proxy API', () => {
  it('mengekspor semua method yang diteruskan', () => {
    for (const handler of [GET, POST, PUT, PATCH, DELETE]) expect(handler).toBeTypeOf('function');
  });

  it('path di luar daftar izin -> 404', async () => {
    args = makeArgs({ path: 'auth/login' });
    const res = await GET(args);
    expect(res.status).toBe(404);
    expect(args.fetch).not.toHaveBeenCalled();
  });

  it('origin asing pada request pengubah data -> 403', async () => {
    args = makeArgs({ method: 'POST', origin: 'http://evil.test', body: '{}' });
    const res = await POST(args);
    expect(res.status).toBe(403);
    expect(args.fetch).not.toHaveBeenCalled();
  });

  it('body terlalu besar -> 413', async () => {
    args = makeArgs({ method: 'POST', origin: ORIGIN, body: 'x'.repeat(64 * 1024 + 1) });
    const res = await POST(args);
    expect(res.status).toBe(413);
    expect(args.fetch).not.toHaveBeenCalled();
  });

  it('GET meneruskan query string dan token sesi, tanpa body', async () => {
    args = makeArgs({ token: 'tok', search: '?page=2' });
    args.fetch.mockResolvedValue(upstreamResponse('{"data":[]}'));
    const res = await GET(args);
    const [url, init] = args.fetch.mock.calls[0];
    expect(url).toBe('http://backend.test/api/homestays?page=2');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBeUndefined();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"data":[]}');
  });

  it('POST meneruskan body JSON; tanpa token tidak ada header Authorization', async () => {
    args = makeArgs({ method: 'POST', origin: ORIGIN, body: '{"a":1}' });
    args.fetch.mockResolvedValue(upstreamResponse('{"ok":true}', { status: 201 }));
    const res = await POST(args);
    const init = args.fetch.mock.calls[0][1];
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.body).toBe('{"a":1}');
    expect(res.status).toBe(201);
  });

  it('DELETE dengan body kosong tidak mengirim Content-Type', async () => {
    args = makeArgs({ method: 'DELETE', path: 'homestays/abc', origin: ORIGIN });
    args.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const res = await DELETE(args);
    const init = args.fetch.mock.calls[0][1];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBeUndefined();
    expect(res.status).toBe(204);
  });

  it('content-type backend dipertahankan, atau default ke JSON bila tidak ada', async () => {
    args = makeArgs();
    args.fetch.mockResolvedValue(new Response('teks', { status: 200, headers: { 'content-type': 'text/plain' } }));
    expect((await GET(args)).headers.get('content-type')).toBe('text/plain');

    args = makeArgs();
    const noType = new Response('x', { status: 200 });
    noType.headers.delete('content-type');
    args.fetch.mockResolvedValue(noType);
    expect((await GET(args)).headers.get('content-type')).toBe('application/json');
  });

  it('backend tidak terjangkau -> 502 dengan pesan error JSON', async () => {
    args = makeArgs();
    args.fetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await GET(args);
    expect(res.status).toBe(502);
    expect((await res.json()).error.message).toMatch(/Tidak dapat terhubung/);
  });
});
