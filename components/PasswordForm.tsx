'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  AUTH_REDIRECT_PATH,
  LANDING_PASSWORD
} from '@/lib/auth';

export default function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      if (password !== LANDING_PASSWORD) {
        setError('Incorrect password. Please try again.');
        return;
      }

      const maxAgeSeconds = 60 * 60 * 24; // 1 day
      document.cookie = `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;

      router.push(AUTH_REDIRECT_PATH);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="label" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        className="input"
        type="password"
        autoComplete="current-password"
        inputMode="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter access password"
        required
        aria-invalid={error ? 'true' : 'false'}
      />

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="actions">
        <button className="button primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking…' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
