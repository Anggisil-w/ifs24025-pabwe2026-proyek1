<script>
  // Dialog modal sederhana. Ditutup dengan tombol × atau tombol Esc.
  let { title, onclose, wide = false, children } = $props();

  function handleKeydown(event) {
    if (event.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 sm:items-center"
  role="presentation"
>
  <div
    class="w-full rounded-2xl bg-white shadow-xl {wide ? 'max-w-2xl' : 'max-w-md'}"
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div class="flex items-center justify-between border-b border-stone-200 px-6 py-4">
      <h2 class="text-lg font-semibold text-stone-900">{title}</h2>
      <button type="button" class="text-2xl leading-none text-stone-600 hover:text-stone-900" aria-label="Tutup dialog" onclick={onclose}>
        ×
      </button>
    </div>
    <div class="px-6 py-5">
      {@render children?.()}
    </div>
  </div>
</div>
