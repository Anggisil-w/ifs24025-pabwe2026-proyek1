import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import ConfirmDialog from './ConfirmDialog.svelte';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

async function open(props = {}) {
  const onconfirm = vi.fn();
  const oncancel = vi.fn();
  render(ConfirmDialog, {
    props: { title: 'Hapus kamar?', message: 'Kamar akan dihapus permanen.', onconfirm, oncancel, ...props }
  });
  await tick();
  return { onconfirm, oncancel };
}

describe('ConfirmDialog', () => {
  it('menampilkan judul dan pesan, dan pesan menjadi deskripsi dialog', async () => {
    await open();
    const dialog = screen.getByRole('dialog', { name: 'Hapus kamar?' });
    const message = screen.getByText('Kamar akan dihapus permanen.');
    expect(dialog.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('memberi fokus awal ke tombol Batal (aksi aman)', async () => {
    await open();
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus();
  });

  it('memanggil onconfirm dan oncancel dari tombolnya masing-masing', async () => {
    const { onconfirm, oncancel } = await open({ confirmLabel: 'Ya, hapus' });
    await fireEvent.click(screen.getByRole('button', { name: 'Ya, hapus' }));
    expect(onconfirm).toHaveBeenCalledTimes(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('memanggil oncancel saat Esc ditekan', async () => {
    const { oncancel } = await open();
    await fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('menonaktifkan kedua tombol dan menampilkan "Memproses…" saat busy', async () => {
    await open({ busy: true });
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Memproses…' })).toBeDisabled();
  });

  it('menampilkan error dari backend di dalam dialog', async () => {
    await open({ error: { message: 'Kamar masih punya pesanan', details: [] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Kamar masih punya pesanan');
  });
});
