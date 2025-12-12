'use client';

import { useRouter } from 'next/navigation';

import { AUTH_COOKIE_NAME } from '@/lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  function logout() {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    router.push('/');
    router.refresh();
  }

  return (
    <button className="button secondary" type="button" onClick={logout}>
      Log out
    </button>
  );
}
