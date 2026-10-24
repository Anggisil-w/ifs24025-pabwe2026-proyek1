import { describe, it, expect } from 'vitest';
import { BOOKING_STATUSES, STATUS_ACTIONS, STATUS_LABELS, STATUS_TRANSITIONS } from './constants.js';
import { ROLES, hasRole, isAdmin } from './auth/roles.js';
import * as validators from './validators.js';

describe('konstanta status pesanan', () => {
  it('setiap status punya label dan daftar transisi', () => {
    for (const status of BOOKING_STATUSES) {
      expect(STATUS_LABELS[status], status).toBeTruthy();
      expect(Array.isArray(STATUS_TRANSITIONS[status]), status).toBe(true);
    }
  });

  it('semua status tujuan punya label tombol aksi', () => {
    for (const targets of Object.values(STATUS_TRANSITIONS)) {
      for (const target of targets) expect(STATUS_ACTIONS[target], target).toBeTruthy();
    }
  });

  it('status akhir tidak punya transisi', () => {
    expect(STATUS_TRANSITIONS.cancelled).toEqual([]);
    expect(STATUS_TRANSITIONS.completed).toEqual([]);
  });
});

describe('roles', () => {
  it('isAdmin hanya benar untuk peran admin', () => {
    expect(isAdmin({ role: ROLES.ADMIN })).toBe(true);
    expect(isAdmin({ role: ROLES.GUEST })).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it('hasRole memeriksa salah satu peran', () => {
    expect(hasRole({ role: 'guest' }, 'guest', 'admin')).toBe(true);
    expect(hasRole({ role: 'guest' }, 'admin')).toBe(false);
    expect(hasRole(null, 'admin')).toBe(false);
    expect(Object.isFrozen(ROLES)).toBe(true);
  });
});

describe('validators (barrel)', () => {
  it('menyatukan aturan dasar dan validator form', () => {
    expect(typeof validators.validateLogin).toBe('function');
    expect(typeof validators.validateRegister).toBe('function');
    expect(typeof validators.isValidEmail).toBe('function');
  });
});
