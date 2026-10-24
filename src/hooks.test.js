import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({ attachSession: vi.fn() }));
vi.mock('#lib/server/auth/session', () => ({ attachSession: mocks.attachSession }));

import { handle, handleError } from './hooks.server.js';
import { handleError as handleClientError } from './hooks.client.js';

let errorSpy;
beforeEach(() => {
  mocks.attachSession.mockReset();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

describe('hooks.server', () => {
  it('handle memulihkan sesi, memasang header keamanan, lalu meneruskan request', async () => {
    const event = { setHeaders: vi.fn() };
    const response = { ok: true };
    const resolve = vi.fn().mockResolvedValue(response);

    expect(await handle({ event, resolve })).toBe(response);
    expect(mocks.attachSession).toHaveBeenCalledWith(event);
    expect(event.setHeaders).toHaveBeenCalledWith({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    expect(resolve).toHaveBeenCalledWith(event);
  });

  it('handleError mencatat error dan mengembalikan pesan ramah', () => {
    const error = new Error('detail teknis');
    const out = handleError({ error, status: 404 });
    expect(errorSpy).toHaveBeenCalledWith(error);
    expect(out.message).toBe('Halaman yang kamu cari tidak ditemukan.');
  });
});

describe('hooks.client', () => {
  it('handleError mencatat error dan mengembalikan pesan ramah', () => {
    const error = new Error('x');
    expect(handleClientError({ error, status: 500 }).message).toContain('kesalahan di sistem kami');
    expect(errorSpy).toHaveBeenCalledWith(error);
  });
});
