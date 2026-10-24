import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }
  return { ApiError, fetchCurrentUser: vi.fn() };
});
vi.mock('#lib/api', () => ({ ApiError: mocks.ApiError, fetchCurrentUser: mocks.fetchCurrentUser }));

import { apiOptions, attachSession } from './session.js';

function makeEvent({ token, path = '/' } = {}) {
  return {
    locals: {},
    url: new URL(`http://localhost${path}`),
    fetch: vi.fn(),
    cookies: { get: vi.fn(() => token), delete: vi.fn() }
  };
}

beforeEach(() => {
  mocks.fetchCurrentUser.mockReset();
});

describe('attachSession', () => {
  it('tanpa cookie: pengguna null dan API tidak dipanggil', async () => {
    const event = makeEvent();
    await attachSession(event);
    expect(event.locals).toEqual({ user: null, token: null });
    expect(mocks.fetchCurrentUser).not.toHaveBeenCalled();
  });

  it('request aset /_app/ dilewati', async () => {
    const event = makeEvent({ token: 't', path: '/_app/immutable/x.js' });
    await attachSession(event);
    expect(event.locals.user).toBeNull();
    expect(mocks.fetchCurrentUser).not.toHaveBeenCalled();
  });

  it('token valid mengisi locals.user dan locals.token', async () => {
    mocks.fetchCurrentUser.mockResolvedValue({ id: 1, role: 'guest' });
    const event = makeEvent({ token: 'abc' });
    await attachSession(event);
    expect(mocks.fetchCurrentUser).toHaveBeenCalledWith('abc', { fetch: event.fetch });
    expect(event.locals).toEqual({ user: { id: 1, role: 'guest' }, token: 'abc' });
  });

  it('401 menghapus cookie', async () => {
    mocks.fetchCurrentUser.mockImplementation(async () => {
      throw new mocks.ApiError(401, 'kedaluwarsa');
    });
    const event = makeEvent({ token: 'abc' });
    await attachSession(event);
    expect(event.locals).toEqual({ user: null, token: null });
    expect(event.cookies.delete).toHaveBeenCalledWith('mj_token', { path: '/' });
  });

  it('kegagalan lain (backend mati) tidak menghapus cookie', async () => {
    mocks.fetchCurrentUser.mockImplementation(async () => {
      throw new mocks.ApiError(0, 'offline');
    });
    const event = makeEvent({ token: 'abc' });
    await attachSession(event);
    expect(event.locals.user).toBeNull();
    expect(event.cookies.delete).not.toHaveBeenCalled();
  });

  it('error non-ApiError juga tidak menghapus cookie', async () => {
    mocks.fetchCurrentUser.mockImplementation(async () => {
      throw new Error('aneh');
    });
    const event = makeEvent({ token: 'abc' });
    await attachSession(event);
    expect(event.cookies.delete).not.toHaveBeenCalled();
  });
});

describe('apiOptions', () => {
  it('membawa fetch dan token sesi', () => {
    const event = { fetch: () => {}, locals: { token: 'abc' } };
    expect(apiOptions(event)).toEqual({ fetch: event.fetch, token: 'abc' });
  });

  it('token null menjadi undefined', () => {
    expect(apiOptions({ fetch: 1, locals: { token: null } }).token).toBeUndefined();
  });
});