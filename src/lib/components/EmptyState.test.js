import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import EmptyState from './EmptyState.svelte';

afterEach(cleanup);

describe('EmptyState', () => {
  it('menampilkan judul saja bila tidak ada deskripsi atau aksi', () => {
    render(EmptyState, { props: { title: 'Belum ada pesanan' } });
    expect(screen.getByText('Belum ada pesanan')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('menampilkan deskripsi bila diisi', () => {
    render(EmptyState, { props: { title: 'Kosong', description: 'Coba ubah filter.' } });
    expect(screen.getByText('Coba ubah filter.')).toBeInTheDocument();
  });

  it('menampilkan tautan aksi hanya bila actionHref diisi', () => {
    render(EmptyState, { props: { title: 'Kosong', actionHref: '/', actionLabel: 'Lihat katalog' } });
    expect(screen.getByRole('link', { name: 'Lihat katalog' })).toHaveAttribute('href', '/');
  });
});
