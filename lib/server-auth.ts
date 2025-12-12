import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from '@/lib/auth';

export function isAuthenticated(): boolean {
  return cookies().get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;
}
