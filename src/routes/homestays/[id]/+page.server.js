import { error } from '@sveltejs/kit';
import { getHomestay, getHomestayRooms, ApiError } from '#lib/api';
import { apiOptions } from '#lib/server/auth/session';

export async function load(event) {
  const options = apiOptions(event);
  try {
    const [homestay, rooms] = await Promise.all([
      getHomestay(event.params.id, options),
      getHomestayRooms(event.params.id, options)
    ]);
    return { homestay, rooms };
  } catch (err) {
    // 400/404 dari backend -> halaman 404; kegagalan lain (mis. backend mati) -> 503
    if (err instanceof ApiError) {
      const notFound = err.status === 400 || err.status === 404;
      error(notFound ? 404 : err.status >= 400 ? err.status : 503, err.message);
    }
    throw err;
  }
}
