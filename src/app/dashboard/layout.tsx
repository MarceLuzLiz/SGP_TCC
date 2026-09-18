// src/app/dashboard/layout.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserNav } from '@/components/auth/UserNav';
import { FiscalNav } from '@/components/navigation/FiscalNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 md:px-6">
        <FiscalNav />

        <div className="ml-auto flex items-center gap-3">
          <UserNav />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}