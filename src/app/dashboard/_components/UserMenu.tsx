'use client';

import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

interface UserMenuProps {
  session: Session | null;
}

export function UserMenu({ session }: UserMenuProps) {
  const userName = session?.user?.name || 'Usuário';

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-green-600">{userName}</span>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600 transition hover:bg-red-100 hover:text-red-700"
        title="Encerrar sessão"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  );
}