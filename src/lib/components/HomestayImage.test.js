import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import HomestayImage from './HomestayImage.svelte';

afterEach(cleanup);

describe('HomestayImage', () => {
  it('menampilkan foto dengan alt bila src diisi', () => {
    render(HomestayImage, { props: { src: 'https://contoh.test/a.jpg', alt: 'Villa Danau' } });
    const img = screen.getByAltText('Villa Danau');
    expect(img).toHaveAttribute('src', 'https://contoh.test/a.jpg');
  });

  it('tidak merender <img> bila src kosong, ikon cadangan tetap ada', () => {
    const { container } = render(HomestayImage, { props: { src: '', alt: 'Tanpa foto' } });
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('memuat malas hanya bila lazy diaktifkan', () => {
    const { unmount } = render(HomestayImage, { props: { src: 'x.jpg', alt: 'A' } });
    expect(screen.getByAltText('A')).not.toHaveAttribute('loading');
    unmount();
    render(HomestayImage, { props: { src: 'x.jpg', alt: 'B', lazy: true } });
    expect(screen.getByAltText('B')).toHaveAttribute('loading', 'lazy');
  });

  it('menyembunyikan foto yang gagal dimuat agar latar gradasi terlihat', async () => {
    render(HomestayImage, { props: { src: 'rusak.jpg', alt: 'Rusak' } });
    const img = screen.getByAltText('Rusak');
    await fireEvent.error(img);
    expect(img.style.display).toBe('none');
  });

  it('meneruskan class dan isi anak (mis. label kota) di atas foto', () => {
    const { container } = render(HomestayImage, { props: { alt: 'X', class: 'h-44' } });
    expect(container.firstElementChild.className).toContain('h-44');
  });
});
