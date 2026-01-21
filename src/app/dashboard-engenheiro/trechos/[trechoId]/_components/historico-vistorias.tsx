'use client';

import { Vistoria, User } from '@prisma/client';
import { Calendar, User as UserIcon } from 'lucide-react';

// O tipo de dado que a página vai nos passar
type VistoriaComUsuario = Vistoria & {
  user: Pick<User, 'name'>;
};

interface HistoricoVistoriasProps {
  vistorias: VistoriaComUsuario[];
}

export function HistoricoVistorias({ vistorias }: HistoricoVistoriasProps) {
  if (vistorias.length === 0) {
    return (
      <p className="text-sm text-center text-muted-foreground py-4">
        Nenhuma vistoria registrada para este trecho.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {vistorias.map((vistoria) => (
        <div key={vistoria.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{vistoria.motivo}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-2 space-x-4">
            <div className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4" />
              <span>
                {new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center">
              <UserIcon className="mr-1.5 h-4 w-4" />
              <span>{vistoria.user.name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}