'use client';

import { Relatorio, User } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
// Assumindo que você moveu ou pode importar estes componentes
import { ApprovalActions } from '@/app/dashboard-engenheiro/equipe/_components/approval-actions';
import Link from 'next/link';

// O tipo de 'relatorios' que recebemos da página
type RelatorioPendente = Relatorio & {
  user: Pick<User, 'name'>;
  // Precisamos do trechoId para as actions, mas já estamos na página do trecho
  // Vamos ajustar o ApprovalActions para receber o trechoId
};

interface TrechoApprovalListProps {
  relatorios: RelatorioPendente[];
}

export function TrechoApprovalList({ relatorios }: TrechoApprovalListProps) {
  if (relatorios.length === 0) {
    return (
      <p className="text-muted-foreground">
        Não há relatórios pendentes de aprovação para este trecho.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {relatorios.map((relatorio) => (
        <Link
                key={relatorio.id}
                href={`/dashboard-engenheiro/${relatorio.tipo.toLowerCase()}/${relatorio.id}`}
          className="flex items-center justify-between rounded-md border p-4"
        >
          <div>
            <h3 className="font-semibold">{relatorio.tipo}</h3>
            <p className="text-sm text-muted-foreground">
              Enviado por: {relatorio.user.name} em{' '}
              {new Date(relatorio.updatedAt).toLocaleDateString('pt-BR')}
            </p>
            <Badge
              variant={
                relatorio.statusAprovacao === 'CORRIGIDO'
                  ? 'default'
                  : 'destructive'
              }
              className={
                relatorio.statusAprovacao === 'CORRIGIDO' ? 'bg-blue-600 text-white' : ''
              }
            >
              {relatorio.statusAprovacao}
            </Badge>
          </div>

          {/* Precisamos garantir que ApprovalActions receba o trechoId */}
          {/* A action 'approveRelatorio' precisa do trechoId */}
          {/* O objeto 'relatorio' já tem 'trechoId' */}
          <ApprovalActions
            relatorio={{ id: relatorio.id, trechoId: relatorio.trechoId }}
          />
        </Link>
      ))}
    </div>
  );
}