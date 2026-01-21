import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Route, NotebookText, ListChecks } from 'lucide-react'; // Ícones para os cards

export default function EngenheiroDashboardHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard do Engenheiro</h1>
      <p className="text-muted-foreground">
        Selecione uma área para gerenciar.
      </p>

      <div className="grid gap-6 pt-4 md:grid-cols-2">
        
        <Link href="/dashboard-engenheiro/vias">
          <Card className="flex h-full flex-col justify-center transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-blue-100 p-3">
                
              <Route className="h-10 w-10 text-blue-600" />
              </div>
              <div className="space-y-1">
                <CardTitle>Vias & Trechos</CardTitle>
                <CardDescription>
                  Visualizar mapas, criar novas vias e analisar dados.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

      <Link href="/dashboard-engenheiro/equipe">
          <Card className="flex h-full flex-col justify-center transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-green-100 p-3">
              <Users className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-1">
                <CardTitle>Equipe</CardTitle>
                <CardDescription>
                  Gerenciar fiscais
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
        </div>      


      <div className="grid gap-6 pt-2 md:grid-cols-2">
        
        <Link href="/dashboard-engenheiro/aprovacoes">
          <Card className="flex h-full flex-col justify-center transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-purple-100 p-3">
              <ListChecks className="h-10 w-10 text-purple-700" />
              </div>
              <div className="space-y-1">
                <CardTitle>Aprovações</CardTitle>
                <CardDescription>
                  Gerenciar aprovações de relatórios.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 2: Vias */}
        <Link href="/dashboard-engenheiro/relatorios">
          <Card className="flex h-full flex-col justify-center transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-orange-100/70 p-3">
              <NotebookText className="h-10 w-10 text-orange-500" />
              </div>
              <div className="space-y-1">
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>
                  Gerenciar relatórios.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
    
  );
}