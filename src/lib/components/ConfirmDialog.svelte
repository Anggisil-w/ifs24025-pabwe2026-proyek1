<script>
  import Modal from './Modal.svelte';
  import Alert from './Alert.svelte';

  // Dialog konfirmasi untuk aksi berisiko (hapus/batalkan). Error dari backend (mis. 409) tampil di sini.
  let {
    title,
    message,
    confirmLabel = 'Hapus',
    busy = false,
    error = null,
    onconfirm,
    oncancel
  } = $props();

  const messageId = `confirm-message-${$props.id()}`;
</script>

<Modal {title} onclose={oncancel} describedby={messageId}>
  <p id={messageId} class="text-sm text-stone-600">{message}</p>

  {#if error}
    <div class="mt-4">
      <Alert {error} />
    </div>
  {/if}

  <div class="mt-6 flex justify-end gap-3">
    <button type="button" class="btn btn-secondary" onclick={oncancel} disabled={busy}>Batal</button>
    <button type="button" class="btn btn-danger" onclick={onconfirm} disabled={busy}>
      {busy ? 'Memproses…' : confirmLabel}
    </button>
  </div>
</Modal>
