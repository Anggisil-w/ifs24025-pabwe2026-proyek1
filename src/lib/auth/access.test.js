import { describe, it, expect } from 'vitest';
import { ACCESS, evaluateAccess } from './access.js';
import { hasRole, isAdmin, ROLES } from './roles.js';

describe('evaluateAccess', () => {
  const guest = { id: 1, role: 'guest' };
  const admin = { id: 2, role: 'admin' };

  it('belum login -> LOGIN, apa pun peran yang diminta', () => {
    expect(evaluateAccess(null)).toBe(ACCESS.LOGIN);
    expect(evaluateAccess(undefined, ['admin'])).toBe(ACCESS.LOGIN);
  });

  it('tanpa batasan peran, cukup sudah login', () => {
    expect(evaluateAccess(guest)).toBe(ACCESS.ALLOW);
    expect(evaluateAccess(guest, [])).toBe(ACCESS.ALLOW);
  });

  it('peran tidak sesuai -> FORBIDDEN, sesuai -> ALLOW', () => {
    expect(evaluateAccess(guest, ['admin'])).toBe(ACCESS.FORBIDDEN);
    expect(evaluateAccess(admin, ['admin'])).toBe(ACCESS.ALLOW);
    expect(evaluateAccess(guest, ['guest', 'admin'])).toBe(ACCESS.ALLOW);
  });
});

describe('roles', () => {
  it('isAdmin dan hasRole', () => {
    expect(isAdmin({ role: ROLES.ADMIN })).toBe(true);
    expect(isAdmin({ role: ROLES.GUEST })).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(hasRole({ role: 'guest' }, 'guest', 'admin')).toBe(true);
    expect(hasRole(null, 'guest')).toBe(false);
  });
});
