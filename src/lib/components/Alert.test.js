import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import Alert from './Alert.svelte';

afterEach(cleanup);

describe('Alert', () => {
  it('tidak merender apa pun bila tidak ada pesan', () => {
    const { container } = render(Alert, { props: {} });
    expect(container.querySelector('[role]')).toBeNull();
  });

  it('menampilkan error sebagai role="alert"', () => {
    render(Alert, { props: { error: { message: 'Gagal menyimpan', details: [] } } });
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal menyimpan');
  });

  it('menerima error berupa teks biasa', () => {
    render(Alert, { props: { error: 'Teks error' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Teks error');
  });

  it('memakai role="status" untuk pesan sukses/info', () => {
    render(Alert, { props: { message: 'Tersimpan', variant: 'success' } });
    expect(screen.getByRole('status')).toHaveTextContent('Tersimpan');
  });

  it('merinci details dari backend per kolom', () => {
    render(Alert, {
      props: {
        error: {
          message: 'Data tidak valid',
          details: [{ field: 'email', message: 'Format email tidak valid' }, 'Teks bebas', { message: 'Tanpa kolom' }]
        }
      }
    });
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['email: Format email tidak valid', 'Teks bebas', 'Tanpa kolom']);
  });

  it('menampilkan tombol tutup hanya bila onclose diberikan', async () => {
    const { unmount } = render(Alert, { props: { message: 'Halo', variant: 'info' } });
    expect(screen.queryByRole('button', { name: 'Tutup pesan' })).toBeNull();
    unmount();

    const onclose = vi.fn();
    render(Alert, { props: { message: 'Halo', variant: 'info', onclose } });
    await fireEvent.click(screen.getByRole('button', { name: 'Tutup pesan' }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
