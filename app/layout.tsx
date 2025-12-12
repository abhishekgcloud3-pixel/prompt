import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Prompt Enhancement App',
  description: 'Password-protected landing page for the prompt enhancement app.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
