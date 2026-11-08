import { UserRole } from '../types/auth';

export const getHomePathByRole = (role?: UserRole): string => {
  if (role === 'STUDENT') return '/browse';
  if (role === 'ADMIN' || role === 'STAFF') return '/admin';
  return '/login';
};
