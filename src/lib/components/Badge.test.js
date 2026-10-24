import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import Badge from './Badge.svelte';
import { STATUS_LABELS } from '#lib/constants';

afterEach(cleanup);

describe('Badge', () => {
  it('menampilkan label status dari STATUS_LABELS', () => {
    render(Badge, { props: { status: 'pending' } });
    expect(screen.getByText(STATUS_LABELS.pending ?? 'pending')).toBeInTheDocument();
  });

  it('memakai label kustom bila diberikan', () => {
    render(Badge, { props: { status: 'active', label: 'Tersedia' } });
    expect(screen.getByText('Tersedia')).toBeInTheDocument();
  });

  it('menampilkan nilai status apa adanya bila tidak dikenal', () => {
    render(Badge, { props: { status: 'misterius' } });
    const badge = screen.getByText('misterius');
    expect(badge.className).toContain('bg-stone-100');
  });

  it('memberi warna berbeda untuk status berbeda', () => {
    const { unmount } = render(Badge, { props: { status: 'cancelled', label: 'x' } });
    const cancelled = screen.getByText('x').className;
    unmount();
    render(Badge, { props: { status: 'completed', label: 'x' } });
    expect(screen.getByText('x').className).not.toBe(cancelled);
  });
});
