import { getCancellationQueue } from '@/lib/data/engenheiro'; // Ou @/lib/data/admin
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { CancellationActions } from './_components/CancellationActions'; // Criaremos a seguir
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CancelamentosPage() {
  const queue = await getCancellationQueue();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de Cancelamento</CardTitle>
        <CardDescription>
          Relatórios Aprovados que Engenheiros solicitaram o cancelamento.
          ({queue.length} pendente(s))
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {queue.length === 0 && (
          <p className="text-muted-foreground">Não há solicitações pendentes.</p>
        )}
        {queue.map((relatorio) => (
          <div
            key={relatorio.id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              {/* Detalhes do Relatório */}
              <div className="space-y-1">
                <Link
                  href={`/dashboard-engenheiro/${relatorio.tipo.toLowerCase()}/${relatorio.id}`}
                  className="font-semibold hover:underline"
                  target="_blank" // Abre em nova aba para o Admin inspecionar
                >
                  {relatorio.trecho.via.name} / {relatorio.trecho.nome}
                </Link>
                <p className="text-sm text-muted-foreground">
                  Tipo: <Badge variant="outline">{relatorio.tipo}</Badge> •
                  Enviado por: {relatorio.user.name}
                </p>
              </div>
              
              {/* Botões de Ação do Admin */}
              <CancellationActions relatorioId={relatorio.id} />
            </div>
            
            {/* Motivo do Engenheiro */}
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 text-sm">
              <p className="font-semibold text-yellow-800">
                <AlertTriangle className="inline-block h-4 w-4 mr-2" />
                Motivo da Solicitação:
              </p>
              <p className="text-yellow-700 mt-1 italic">
                {relatorio.motivoCancelamento}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}