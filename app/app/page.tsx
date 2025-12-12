import Link from 'next/link';
import { redirect } from 'next/navigation';

import LogoutButton from '@/components/LogoutButton';
import { isAuthenticated } from '@/lib/server-auth';

export default function PromptEnhancementAppPage() {
  if (!isAuthenticated()) {
    redirect('/');
  }

  return (
    <main className="page">
      <div className="card">
        <h1 className="title">Prompt Enhancement App</h1>
        <p className="subtitle">
          You&apos;re authenticated. This is the next page (main app placeholder).
        </p>

        <div className="actions">
          <Link className="button" href="/">
            Landing
          </Link>
          <LogoutButton />
        </div>

        <p className="smallNote">
          Replace this page with your prompt enhancement UI when ready.
        </p>
      </div>
    </main>
  );
}
