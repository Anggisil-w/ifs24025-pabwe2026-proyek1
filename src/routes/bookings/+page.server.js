import { listBookings, toErrorInfo } from '#lib/api';
import { BOOKING_STATUSES } from '#lib/constants';
import { requireUser } from '#lib/server/auth/guards';
import { apiOptions } from '#lib/server/auth/session';

// Filter status disimpan di URL (?status=pending). Nilai di luar daftar diabaikan.
export async function load(event) {
  requireUser(event);
  const requested = event.url.searchParams.get('status') ?? '';
  const status = BOOKING_STATUSES.includes(requested) ? requested : '';

  try {
    const bookings = await listBookings({ status }, apiOptions(event));
    return { status, bookings, loadError: null };
  } catch (err) {
    return { status, bookings: [], loadError: toErrorInfo(err) };
  }
}
