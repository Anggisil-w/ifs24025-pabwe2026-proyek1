import { describe, it, expect } from 'vitest';
import { redirectIfAuthenticated, requireAdmin, requireUser } from './guards.js';

function thrown(fn) {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return null;
}

const event = (user, path = '/bookings?status=pending', token = 'tok') => ({
  locals: { user, token },
  url: new URL(`http://localhost${path}`)
});

describe('requireUser', () => {
  it('belum login: redirect 303 ke login dengan ?next=', () => {
    const e = thrown(() => requireUser(event(null)));
    expect(e.status).toBe(303);
    expect(e.location).toBe('/login?next=%2Fbookings%3Fstatus%3Dpending');
  });

  it('peran tidak sesuai: 403', () => {
    const e = thrown(() => requireUser(event({ role: 'guest' }), 'admin'));
    expect(e.status).toBe(403);
  });

  it('pengguna yang berhak mendapat { user, token }', () => {
    const user = { id: 1, role: 'guest' };
    expect(requireUser(event(user))).toEqual({ user, token: 'tok' });
    expect(requireUser(event(user), 'guest', 'admin').user).toBe(user);
  });
});

describe('requireAdmin', () => {
  it('admin lolos, guest ditolak, anonim diarahkan', () => {
    expect(requireAdmin(event({ role: 'admin' })).user.role).toBe('admin');
    expect(thrown(() => requireAdmin(event({ role: 'guest' }))).status).toBe(403);
    expect(thrown(() => requireAdmin(event(null, '/admin'))).location).toBe('/login?next=%2Fadmin');
  });
});

describe('redirectIfAuthenticated', () => {
  it('tamu mendapat { next } yang sudah aman', () => {
    expect(redirectIfAuthenticated(event(null, '/login?next=/bookings'))).toEqual({ next: '/bookings' });
    expect(redirectIfAuthenticated(event(null, '/login?next=//evil.com'))).toEqual({ next: '/' });
    expect(redirectIfAuthenticated(event(null, '/login'))).toEqual({ next: '/' });
  });

  it('yang sudah login dialihkan ke tujuan', () => {
    const e = thrown(() => redirectIfAuthenticated(event({ id: 1 }, '/login?next=/bookings')));
    expect(e.status).toBe(303);
    expect(e.location).toBe('/bookings');
  });
});
