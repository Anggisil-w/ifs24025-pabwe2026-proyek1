// Peran pengguna yang dikenal frontend (cermin backend; backend tetap penentu akhir).

export const ROLES = Object.freeze({ GUEST: 'guest', ADMIN: 'admin' });

export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const hasRole = (user, ...roles) => Boolean(user) && roles.includes(user.role);
