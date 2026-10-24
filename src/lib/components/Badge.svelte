<script>
  import { STATUS_LABELS } from '#lib/constants';

  // status: pending | confirmed | cancelled | completed | active | inactive
  let { status, label = '' } = $props();

  // Nama kelas ditulis lengkap agar terdeteksi oleh Tailwind
  const styles = {
    pending: 'bg-amber-100 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-100 text-sky-800 ring-sky-200',
    cancelled: 'bg-red-100 text-red-800 ring-red-200',
    completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    active: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    inactive: 'bg-stone-200 text-stone-700 ring-stone-300'
  };

  const text = $derived(label || STATUS_LABELS[status] || status);
  const style = $derived(styles[status] ?? 'bg-stone-100 text-stone-700 ring-stone-200');
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset {style}">
  {text}
</span>
