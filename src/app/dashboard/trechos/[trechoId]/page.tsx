import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ChevronLeft,
  ClipboardList, 
  GalleryHorizontal, 
  FileText, 
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import { formatKmToStakes } from '@/lib/formatters';

async function getTrechoDetails(trechoId: string) {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true,
    },
  });
  return trecho;
}

export default async function TrechoPage({ params }: { params: Promise<{ trechoId: string }> }) {
  const resolvedParams = await params;
  const trecho = await getTrechoDetails(resolvedParams.trechoId);

  if (!trecho) {
    notFound();
  }

  const vistoriasUrl = `/dashboard/trechos/${trecho.id}/vistorias`;
  const galeriaUrl = `/dashboard/trechos/${trecho.id}/galeria`;
  const rftUrl = `/dashboard/trechos/${trecho.id}/rft`;
  const rdsUrl = `/dashboard/trechos/${trecho.id}/rds`;
  const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);

  const modules = [
    {
      href: vistoriasUrl,
      title: 'Vistorias',
      description: 'Registrar e consultar visitas técnicas de campo.',
      icon: ClipboardList,
      colorBadge: 'bg-teal-50 dark:bg-teal-950/70 border-teal-100/60 dark:border-teal-900/40 text-teal-700 dark:text-teal-300',
    },
    {
      href: galeriaUrl,
      title: 'Galeria',
      description: 'Visualizar e gerenciar fotos de patologias coletadas.',
      icon: GalleryHorizontal,
      colorBadge: 'bg-purple-50 dark:bg-purple-950/70 border-purple-100/60 dark:border-purple-900/40 text-purple-700 dark:text-purple-300',
    },
    {
      href: rftUrl,
      title: 'RFT',
      description: 'Elaborar Relatórios Fotográficos Técnicos.',
      icon: FileText,
      colorBadge: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-100/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    },
    {
      href: rdsUrl,
      title: 'RDS',
      description: 'Preencher Relatórios Diários de Serviço em campo.',
      icon: CalendarDays,
      colorBadge: 'bg-amber-50 dark:bg-amber-950/70 border-amber-100/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Botão de Retorno */}
      <Link
        href={`/dashboard/vias/${trecho.via.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para {trecho.via.name}
      </Link>

      {/* Header do Trecho */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: trecho.cor || '#0d9488' }}
          />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {trecho.nome}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Extensão: {extensaoKm.toFixed(2)} km
          <span className="text-slate-300 dark:text-slate-700 mx-2">|</span>
          Estaqueamento: {formatKmToStakes(trecho.kmInicial)} até {formatKmToStakes(trecho.kmFinal)}
          <span className="text-slate-300 dark:text-slate-700 mx-2">|</span>
          Via: {trecho.via.name}
        </p>
      </div>

      {/* Grid com os 4 módulos do fiscal */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              href={mod.href}
              className="group block rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-2xl border p-3 ${mod.colorBadge} group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors mb-1.5">
                {mod.title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mod.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}