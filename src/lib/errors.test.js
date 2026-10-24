import { describe, it, expect } from 'vitest';
import { friendlyErrorMessage } from './errors';

describe('friendlyErrorMessage', () => {
  it('memberi pesan khusus untuk 404, 403, dan 401', () => {
    expect(friendlyErrorMessage(404)).toMatch(/tidak ditemukan/);
    expect(friendlyErrorMessage(403)).toMatch(/akses/);
    expect(friendlyErrorMessage(401)).toMatch(/masuk kembali/);
  });

  it('memberi pesan sistem untuk 5xx atau status kosong', () => {
    expect(friendlyErrorMessage(500)).toMatch(/kesalahan di sistem/);
    expect(friendlyErrorMessage(undefined)).toMatch(/kesalahan di sistem/);
  });

  it('memberi pesan umum untuk error klien lain', () => {
    expect(friendlyErrorMessage(400)).toMatch(/tidak dapat diproses/);
  });
});
