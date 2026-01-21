import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CreateViaForm } from './_components/create-via-form';

export default function NovaViaPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard-engenheiro/vias"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para Vias
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Adicionar Nova Via</h1>
        <p className="text-muted-foreground">
          Preencha os dados e desenhe o traçado da via no mapa.
        </p>
      </div>

      {/* Este é o componente principal com toda a lógica */}
      <CreateViaForm />
    </div>
  );
}