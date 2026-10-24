<script>
  import { invalidateAll } from '$app/navigation';
  import Alert from '#lib/components/Alert.svelte';
  import Badge from '#lib/components/Badge.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
  import { updateBookingStatus, toErrorInfo } from '#lib/api';
  import { BOOKING_STATUSES, STATUS_LABELS, STATUS_TRANSITIONS, STATUS_ACTIONS } from '#lib/constants';
  import { formatRupiah, formatDate, formatDateTime, countNights } from '#lib/format';
  import { useSession } from '#lib/auth/session';
  import { useToast } from '#lib/toast.svelte.js';

  let { data } = $props();
  const toast = useToast();
  const session = useSession();

  const isAdmin = $derived(session.isAdmin);

  // Tamu hanya boleh membatalkan; konfirmasi dan penyelesaian hanya admin (backend juga menegakkan ini)
  const allowedNext = (booking) =>
    (STATUS_TRANSITIONS[booking.status] ?? []).filter((status) => isAdmin || status === 'cancelled');

  let busyId = $state(null);

  // Dialog konfirmasi khusus pembatalan (aksi yang tidak bisa dibalik)
  let cancelTarget = $state(null);
  let dialogBusy = $state(false);
  let dialogError = $state(null);

  const tabs = [{ value: '', label: 'Semua' }, ...BOOKING_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))];

  async function changeStatus(booking, status) {
    busyId = booking.id;
    try {
      await updateBookingStatus(booking.id, status);
      toast.success(`Pesanan #${booking.id} diubah menjadi "${STATUS_LABELS[status]}".`);
      await invalidateAll(); // muat ulang daftar dari server
    } catch (err) {
      toast.error(toErrorInfo(err).message);
    } finally {
      busyId = null;
    }
  }

  // Pembatalan wajib lewat konfirmasi; status lain langsung diproses
  function handleAction(booking, status) {
    if (status === 'cancelled') {
      dialogError = null;
      cancelTarget = booking;
    } else {
      changeStatus(booking, status);
    }
  }

  async function confirmCancel() {
    dialogBusy = true;
    dialogError = null;
    try {
      await updateBookingStatus(cancelTarget.id, 'cancelled');
      toast.success(`Pesanan #${cancelTarget.id} dibatalkan.`);
      cancelTarget = null;
      await invalidateAll();
    } catch (err) {
      dialogError = toErrorInfo(err);
    } finally {
      dialogBusy = false;
    }
  }
</script>

<svelte:head>
  <title>Daftar Pesanan · Mulakjabu</title>
</svelte:head>

<div class="mb-6">
  <h1 class="text-2xl font-bold text-stone-900">{isAdmin ? 'Daftar Pesanan' : 'Pesanan Saya'}</h1>
  <p class="text-sm text-stone-500">
    {isAdmin ? 'Pantau pesanan masuk dan ubah statusnya.' : 'Riwayat pesananmu. Pesanan yang belum selesai bisa dibatalkan.'}
  </p>
</div>

<!-- Filter status -->
<div class="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter status pesanan">
  {#each tabs as tab (tab.value)}
    <a
      href={tab.value ? `/bookings?status=${tab.value}` : '/bookings'}
      role="tab"
      aria-selected={data.status === tab.value}
      class="btn btn-sm {data.status === tab.value ? 'btn-primary' : 'btn-secondary'}"
    >
      {tab.label}
    </a>
  {/each}
</div>

{#if data.loadError}
  <div class="mb-4"><Alert error={data.loadError} /></div>
{/if}

{#if !data.loadError}
  {#if data.bookings.length === 0}
    <EmptyState
      title={data.status ? `Belum ada pesanan berstatus "${STATUS_LABELS[data.status]}".` : 'Belum ada pesanan.'}
      actionHref={!isAdmin && !data.status ? '/' : ''}
      actionLabel="Cari homestay"
    />
  {:else}
    <p class="mb-3 text-sm text-stone-500">{data.bookings.length} pesanan</p>

    <div class="space-y-4">
      {#each data.bookings as booking (booking.id)}
        {@const nextStatuses = allowedNext(booking)}
        {@const nights = countNights(booking.check_in, booking.check_out)}
        <article class="card p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-sm text-stone-500">#{booking.id}</span>
                <Badge status={booking.status} />
              </div>
              <h2 class="mt-1 text-lg font-semibold text-stone-900">
                {booking.homestay_name ?? 'Homestay'} · {booking.room_name ?? `Kamar #${booking.room_id}`}
              </h2>
            </div>
            <p class="text-right">
              <span class="block text-xs text-stone-500">Total</span>
              <span class="text-lg font-bold text-brand-700">{formatRupiah(booking.total_price)}</span>
            </p>
          </div>

          <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs uppercase tracking-wide text-stone-500">Tamu</dt>
              <dd class="font-medium text-stone-800">{booking.guest_name}</dd>
              <dd class="text-stone-600">{booking.guest_email}</dd>
              {#if booking.guest_phone}<dd class="text-stone-600">{booking.guest_phone}</dd>{/if}
              <dd class="text-stone-600">{booking.guests_count} tamu</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-stone-500">Menginap</dt>
              <dd class="font-medium text-stone-800">{formatDate(booking.check_in)} – {formatDate(booking.check_out)}</dd>
              <dd class="text-stone-600">{nights} malam</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-stone-500">Dibuat</dt>
              <dd class="text-stone-600">{formatDateTime(booking.created_at)}</dd>
            </div>
          </dl>

          <div class="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 pt-4">
            {#if nextStatuses.length === 0}
              <span class="text-xs text-stone-600">
                {STATUS_TRANSITIONS[booking.status]?.length ? 'Menunggu konfirmasi admin' : 'Status akhir, tidak dapat diubah lagi'}
              </span>
            {:else}
              {#each nextStatuses as status (status)}
                <button
                  type="button"
                  class="btn btn-sm {status === 'cancelled' ? 'btn-secondary text-red-700' : 'btn-primary'}"
                  disabled={busyId === booking.id}
                  onclick={() => handleAction(booking, status)}
                >
                  {busyId === booking.id ? 'Memproses…' : STATUS_ACTIONS[status]}
                </button>
              {/each}
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
{/if}

{#if cancelTarget}
  <ConfirmDialog
    title="Batalkan pesanan?"
    message="Pesanan #{cancelTarget.id} atas nama {cancelTarget.guest_name} akan dibatalkan dan statusnya tidak dapat diubah lagi."
    confirmLabel="Ya, batalkan"
    busy={dialogBusy}
    error={dialogError}
    onconfirm={confirmCancel}
    oncancel={() => (cancelTarget = null)}
  />
{/if}
