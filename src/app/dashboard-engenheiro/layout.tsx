import { ReactNode } from 'react';
import { UserNav } from '@/components/auth/UserNav';
import { EngenheiroNav } from '@/components/navigation/EngenheiroNav';

interface EngenheiroLayoutProps {
  children: ReactNode;
}

export default function EngenheiroLayout({ children }: EngenheiroLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 md:px-6">
        <EngenheiroNav />
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