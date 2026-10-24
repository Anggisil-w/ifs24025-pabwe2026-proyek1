<script>
  // error: objek { message, details } (ApiError / hasil toErrorInfo) atau teks biasa.
  // Atau isi langsung `message` untuk notifikasi sukses/info.
  let { error = null, message = '', variant = 'error', onclose = null } = $props();

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800'
  };

  const text = $derived(message || (typeof error === 'string' ? error : (error?.message ?? '')));
  const details = $derived(Array.isArray(error?.details) ? error.details : []);

  // details dari backend berbentuk { field, message }
  function formatDetail(item) {
    if (typeof item === 'string') return item;
    if (item?.field && item?.message) return `${item.field}: ${item.message}`;
    return item?.message ?? JSON.stringify(item);
  }
</script>

{#if text}
  <div
    role={variant === 'error' ? 'alert' : 'status'}
    class="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm {styles[variant] ?? styles.error}"
  >
    <div class="flex-1">
      <p class="font-semibold">{text}</p>
      {#if details.length > 0}
        <ul class="mt-1 list-disc space-y-0.5 pl-5">
          {#each details as item}
            <li>{formatDetail(item)}</li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if onclose}
      <button type="button" class="text-lg leading-none opacity-60 hover:opacity-100" aria-label="Tutup pesan" onclick={onclose}>
        ×
      </button>
    {/if}
  </div>
{/if}
