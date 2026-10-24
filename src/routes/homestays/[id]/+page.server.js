import { error } from '@sveltejs/kit';
import { getHomestay, getHomestayRooms, ApiError } from '#lib/api';
import { apiOptions } from '#lib/server/auth/session';

// 400/404 -> 404; status error lain diteruskan; selain itu (mis. 0 saat backend mati) -> 503
function errorStatus(status) {
  if (status === 400 || status === 404) return 404;
  return status >= 400 ? status : 503;
}

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
      error(errorStatus(err.status), err.message);
    }
    throw err;
  }
}
