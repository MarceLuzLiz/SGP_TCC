import { CreateViaForm } from './_components/create-via-form';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

export default function NovaViaPage() {
  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[
          { label: 'Vias & Trechos', href: '/dashboard-engenheiro/vias' },
          { label: 'Adicionar Nova Via' },
        ]}
        backHref="/dashboard-engenheiro/vias"
        backLabel="Voltar para Vias"
      />

      <div>
        <h1 className="text-3xl font-bold">Adicionar Nova Via</h1>
        <p className="text-muted-foreground">
          Preencha os dados e desenhe o traçado da via no mapa.
        </p>
      </div>

      <CreateViaForm />
    </div>
  );
}