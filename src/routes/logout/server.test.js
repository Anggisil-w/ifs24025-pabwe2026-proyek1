import { describe, it, expect, vi } from 'vitest';
import { POST } from './+server.js';

describe('POST /logout', () => {
  it('menghapus cookie sesi lalu mengalihkan ke beranda (303)', () => {
    const cookies = { delete: vi.fn() };
    let thrown;
    try {
      POST({ cookies });
    } catch (err) {
      thrown = err;
    }
    expect(cookies.delete).toHaveBeenCalledWith('mj_token', { path: '/' });
    expect(thrown).toMatchObject({ status: 303, location: '/' });
  });
});
