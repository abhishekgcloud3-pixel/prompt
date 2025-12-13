import { redirect } from 'next/navigation';

import PasswordForm from '@/components/PasswordForm';
import { AUTH_REDIRECT_PATH } from '@/lib/auth';
import { isAuthenticated } from '@/lib/server-auth';

export default function HomePage() {
  if (isAuthenticated()) {
    redirect(AUTH_REDIRECT_PATH);
  }

  return (
    <main className="page">
      <div className="card">
        <h1 className="title">Video Prompt Enhancement Engine</h1>
        <p className="subtitle">
          This is a password-protected landing page. Enter the password to access
          the video prompt enhancement tool specialized for professional video generation.
        </p>

        <PasswordForm />

        <p className="smallNote">
          Authentication is stored in a simple client-side cookie for ease of
          deployment.
        </p>
      </div>
    </main>
  );
}
