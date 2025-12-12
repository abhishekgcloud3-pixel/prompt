import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/server-auth';
import MainApp from '@/components/MainApp';

export default function PromptEnhancementAppPage() {
  if (!isAuthenticated()) {
    redirect('/');
  }

  return (
    <main className="page">
      <MainApp />
    </main>
  );
}
