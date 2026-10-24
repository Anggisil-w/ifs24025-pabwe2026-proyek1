import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import Modal from './Modal.svelte';

// Isi dialog: satu kolom dan dua tombol, agar urutan fokus mudah diuji
const body = createRawSnippet(() => ({
  render: () => '<div><input aria-label="Nama" /><button type="button">Simpan</button><button type="button">Batal</button></div>'
}));

async function open(props = {}) {
  const onclose = vi.fn();
  const view = render(Modal, { props: { title: 'Ubah data', onclose, children: body, ...props } });
  await tick();
  return { onclose, ...view };
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('Modal: struktur dan aksesibilitas', () => {
  it('berperan sebagai dialog modal yang berlabel judulnya', async () => {
    await open();
    const dialog = screen.getByRole('dialog', { name: 'Ubah data' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy)).toHaveTextContent('Ubah data');
  });

  it('menghubungkan deskripsi bila describedby diberikan', async () => {
    await open({ describedby: 'penjelasan' });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'penjelasan');
  });

  it('memberi id judul yang unik untuk setiap dialog', async () => {
    await open();
    await open({ title: 'Dialog kedua' });
    const ids = screen.getAllByRole('dialog').map((el) => el.getAttribute('aria-labelledby'));
    expect(new Set(ids).size).toBe(2);
  });

  it('mengunci gulir halaman selama terbuka dan memulihkannya saat ditutup', async () => {
    document.body.style.overflow = 'auto';
    const { unmount } = await open();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('Modal: manajemen fokus', () => {
  it('memindahkan fokus ke kontrol pertama di isi dialog', async () => {
    await open();
    expect(screen.getByLabelText('Nama')).toHaveFocus();
  });

  it('memakai tombol tutup sebagai fokus awal bila isi tidak punya kontrol', async () => {
    await open({ children: createRawSnippet(() => ({ render: () => '<p>Hanya teks</p>' })) });
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus();
  });

  it('mengembalikan fokus ke pemicu setelah ditutup', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = await open();
    expect(trigger).not.toHaveFocus();
    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('Tab dari kontrol terakhir kembali ke kontrol pertama (focus trap)', async () => {
    await open();
    screen.getByRole('button', { name: 'Batal' }).focus();
    await fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus();
  });

  it('Shift+Tab dari kontrol pertama pindah ke kontrol terakhir', async () => {
    await open();
    screen.getByRole('button', { name: 'Tutup dialog' }).focus();
    await fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus();
  });

  it('menarik fokus kembali bila Tab ditekan saat fokus berada di luar dialog', async () => {
    await open();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    await fireEvent.keyDown(outside, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus();
    outside.remove();
  });
});

describe('Modal: menutup', () => {
  it('menutup dengan tombol Esc', async () => {
    const { onclose } = await open();
    await fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('menutup dengan tombol ×', async () => {
    const { onclose } = await open();
    await fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('tidak menutup untuk tombol lain', async () => {
    const { onclose } = await open();
    await fireEvent.keyDown(document.activeElement, { key: 'a' });
    expect(onclose).not.toHaveBeenCalled();
  });
});
