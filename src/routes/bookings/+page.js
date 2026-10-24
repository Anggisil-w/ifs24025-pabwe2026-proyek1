import { listBookings, toErrorInfo } from '#lib/api';
import { BOOKING_STATUSES } from '#lib/constants';

// Filter status disimpan di URL (?status=pending). Nilai di luar daftar diabaikan.
export async function load({ url, fetch, parent }) {
  const { token } = await parent();
  const requested = url.searchParams.get('status') ?? '';
  const status = BOOKING_STATUSES.includes(requested) ? requested : '';

  try {
    const bookings = await listBookings({ status }, { fetch, token });
    return { status, bookings, loadError: null };
  } catch (err) {
    return { status, bookings: [], loadError: toErrorInfo(err) };
  }
}
