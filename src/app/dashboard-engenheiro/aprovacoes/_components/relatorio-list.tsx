'use client';

import { Relatorio, User, Trecho, Via } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ApprovalActions } from '@/app/dashboard-engenheiro/equipe/_components/approval-actions';
import { RequestCancellationButton } from './RequestCancellationButton'; // 1. Importar
import { DownloadIndividualButton } from '@/components/pdf/SmartPdfButtons'; // <-- Importe
import React from 'react';

type RelatorioComDados = Relatorio & {
  user: Pick<User, 'name'>;
  trecho: Pick<Trecho, 'id' | 'nome'> & {
    via: Pick<Via, 'name'>;
  };
};

interface RelatorioListProps {
  relatorios: RelatorioComDados[];
  // 2. Renomear prop para ser mais explícita
  listType: 'pendentes' | 'aprovados' | 'reprovados' | 'all_search';
}

export function RelatorioList({ relatorios, listType }: RelatorioListProps) {
  if (relatorios.length === 0) {
    return (
      <p className="text-sm text-center text-muted-foreground py-4">
        Nenhum relatório encontrado para esta seleção.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {relatorios.map((relatorio) => (
        <Link
          key={relatorio.id}
          href={`/dashboard-engenheiro/${relatorio.tipo.toLowerCase()}/${relatorio.id}`}
          className="block border rounded-lg p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">
                {relatorio.trecho.via.name} / {relatorio.trecho.nome}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{relatorio.tipo}</span> • Vistoria
                realizada em{' '}
                {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')} -
                Enviado por {relatorio.user.name} em{' '}
                {new Date(relatorio.updatedAt).toLocaleDateString('pt-BR')}
              </p>
              {relatorio.statusAprovacao === 'CORRIGIDO' && (
                <Badge className="bg-blue-600 text-white">CORRIGIDO</Badge>
              )}
              {/* 3. Badge para o novo status */}
              {relatorio.statusAprovacao === 'CANCELAMENTO_PENDENTE' && (
                <Badge className="bg-yellow-600 text-white">
                  CANCELAMENTO PENDENTE
                </Badge>
              )}
            </div>
            

            {/* --- 4. LÓGICA DE BOTÕES ATUALIZADA --- */}
            <div className="flex items-center gap-2">

            
            
            {/* Mostra botões de Aprovar/Reprovar na lista de "pendentes" */}
            {listType === 'pendentes' && (
              <ApprovalActions
                relatorio={{ id: relatorio.id, trechoId: relatorio.trecho.id }}
              />
            )}

            {/* --- ADIÇÃO: Botão de Download (apenas se Aprovado) --- */}
     {relatorio.statusAprovacao === 'APROVADO' && (
        <DownloadIndividualButton id={relatorio.id} />
     )}

            
            
            
            {/* Mostra botão de "Solicitar Cancelamento" na lista de "aprovados" */}
            {listType === 'aprovados' && (
              <RequestCancellationButton
                relatorioId={relatorio.id}
                status={relatorio.statusAprovacao}
              />
            )}

            
            
            {/* Mostra o status para as outras listas */}
            {(listType === 'reprovados' || listType === 'all_search') &&
              relatorio.statusAprovacao !== 'CANCELAMENTO_PENDENTE' && (
              <Badge variant="outline">{relatorio.statusAprovacao}</Badge>
            )}
            {/* --- FIM DA ATUALIZAÇÃO --- */}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}