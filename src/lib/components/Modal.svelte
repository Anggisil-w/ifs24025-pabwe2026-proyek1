<script>
  import { onMount } from 'svelte';

  // Dialog modal yang ramah keyboard dan pembaca layar:
  //  - judul dihubungkan lewat aria-labelledby (dan deskripsi opsional lewat aria-describedby)
  //  - fokus pindah ke dalam dialog saat dibuka, terkunci di dalamnya (Tab / Shift+Tab berputar),
  //    lalu dikembalikan ke elemen pemicu saat ditutup
  //  - Esc atau tombol × menutup dialog; halaman di belakangnya tidak bisa digulir selama dialog terbuka
  let { title, onclose, wide = false, describedby = undefined, children } = $props();

  const uid = $props.id();
  const titleId = `modal-title-${uid}`;

  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let dialog = $state();
  let content = $state();

  const focusables = () => (dialog ? [...dialog.querySelectorAll(FOCUSABLE)] : []);

  onMount(() => {
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Fokus awal: kontrol pertama di isi dialog (mis. kolom form, atau tombol "Batal" pada konfirmasi);
    // jika tidak ada, tombol tutup; jika tetap tidak ada, dialog itu sendiri.
    const initial = content?.querySelector(FOCUSABLE) ?? focusables()[0] ?? dialog;
    initial?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  });

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose?.();
      return;
    }
    if (event.key !== 'Tab' || !dialog) return;

    const items = focusables();
    if (items.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (!dialog.contains(active)) {
      // Fokus sempat lepas dari dialog (mis. klik latar): tarik kembali
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 sm:items-center"
  role="presentation"
>
  <div
    bind:this={dialog}
    class="w-full rounded-2xl bg-white shadow-xl {wide ? 'max-w-2xl' : 'max-w-md'}"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={describedby}
    tabindex="-1"
  >
    <div class="flex items-center justify-between border-b border-stone-200 px-6 py-4">
      <h2 id={titleId} class="text-lg font-semibold text-stone-900">{title}</h2>
      <button type="button" class="text-2xl leading-none text-stone-600 hover:text-stone-900" aria-label="Tutup dialog" onclick={onclose}>
        ×
      </button>
    </div>
    <div bind:this={content} class="px-6 py-5">
      {@render children?.()}
    </div>
  </div>
</div>
