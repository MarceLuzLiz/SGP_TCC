import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-destructive" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Acessando painel administrativo...
        </p>
      </div>
    </div>
  );
}