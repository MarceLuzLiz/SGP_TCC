// src/app/dashboard/profile/_components/ReprovadoCard.tsx
'use client';

import type { Relatorio, Trecho, Via, Vistoria } from '@prisma/client';
import Link from 'next/link'; // Manter o import do Link para o futuro
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FilePenLine, Trash2 } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';

type RelatorioCompleto = Relatorio & {
  trecho: Trecho & { via: Via };
  vistoria: Vistoria;
};

interface ReprovadoCardProps {
  relatorio: RelatorioCompleto;
}

export function ReprovadoCard({ relatorio }: ReprovadoCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Tem certeza que deseja excluir este ${relatorio.tipo}?`)) {
      startTransition(async () => {
        const result = await deleteRelatorio(relatorio.id, relatorio.trechoId, relatorio.tipo);
        if (result.error) alert(`Erro: ${result.error}`);
        else alert(result.success);
      });
    }
  };

  // NOVO: Função específica para o botão de correção
  const handleCorrect = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique acione o onClick do card principal
    const editPath = `/dashboard/trechos/${relatorio.trechoId}/${relatorio.tipo.toLowerCase()}/${relatorio.id}/edit`;
    router.push(editPath);
  };

  const tipoLowerCase = relatorio.tipo.toLowerCase();
  const detailPath = `/dashboard/trechos/${relatorio.trechoId}/${tipoLowerCase}/${relatorio.id}`;

  return (
    <div
      onClick={() => router.push(detailPath)}
      className="block group p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg hover:bg-red-100 transition cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-red-800">Seu {relatorio.tipo} de {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')} foi reprovado.</p>
          <p className="text-xs text-gray-500">{relatorio.trecho.via.name} - {relatorio.trecho.nome}</p>
          <p className="text-sm text-red-700 mt-2"><strong>Motivo:</strong> {relatorio.motivoReprovacao}</p>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* MUDANÇA: O ícone de correção agora é um botão com um onClick */}
          <button
            onClick={handleCorrect}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
            title="Corrigir"
          >
            <FilePenLine size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-100 rounded-full"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}