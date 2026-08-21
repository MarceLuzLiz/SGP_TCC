'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, X, Route, MapPin, Milestone } from 'lucide-react';
import { EditViaDialog } from '@/app/dashboard-engenheiro/vias/[viaId]/_components/EditViaDialog';
import { RequestExclusionDialog } from '@/app/dashboard-engenheiro/vias/[viaId]/_components/RequestExclusionDialog';

interface ViaData {
  id: string;
  name: string;
  bairro: string;
  municipio: string;
  estado: string;
  extensaoKm: number;
  estacas: string | null;
  isSuspended?: boolean;
  _count: {
    trechos: number;
  };
}

interface ViasClientListProps {
  initialVias: ViaData[];
}

export function ViasClientList({ initialVias }: ViasClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtra as vias com base na busca (case insensitive)
  const filteredVias = initialVias.filter((via) =>
    via.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    via.bairro?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    via.municipio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Vias & Trechos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie o cadastro, visualize traçados cartográficos e acompanhe os trechos das vias.
          </p>
        </div>
        <Button asChild className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm gap-2">
          <Link href="/dashboard-engenheiro/vias/novo">
            <PlusCircle className="h-4 w-4" />
            Adicionar Nova Via
          </Link>
        </Button>
      </div>

      {/* BARRA DE BUSCA COM BOTÃO DE LIMPAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, bairro ou município..."
          className="pl-9 pr-8 h-9 text-sm focus:border-teal-600 focus:ring-teal-500/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            title="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* GRID DE CARDS */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredVias.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed p-8 bg-muted/20">
            <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <Route className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base">
              {searchQuery ? 'Nenhuma via encontrada' : 'Nenhuma via cadastrada ainda'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Não encontramos resultados para "${searchQuery}". Tente outro termo.`
                : 'Comece criando a primeira via com traçado vetorial e estaqueamento.'}
            </p>
            {!searchQuery && (
              <Button asChild className="mt-4 gap-2 bg-teal-700 hover:bg-teal-800 text-white" size="sm">
                <Link href="/dashboard-engenheiro/vias/novo">
                  <PlusCircle className="h-4 w-4" />
                  Cadastrar Primeira Via
                </Link>
              </Button>
            )}
          </div>
        )}

        {filteredVias.map((via) => (
          <Card
            key={via.id}
            className="group flex flex-col justify-between rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out"
          >
            <CardHeader className="space-y-2.5 p-5">
              <div className="flex items-start justify-between gap-2">
                <CardTitle
                  className="line-clamp-2 text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out leading-snug"
                  title={via.name}
                >
                  {via.name}
                </CardTitle>

                {/* BOTÕES DE AÇÃO RÁPIDA */}
                <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
                  <EditViaDialog
                    via={via}
                    showIconOnly={true}
                    triggerVariant="ghost"
                  />
                  {!via.isSuspended && (
                    <RequestExclusionDialog
                      type="via"
                      id={via.id}
                      name={via.name}
                      showIconOnly={true}
                      buttonVariant="ghost"
                      buttonSize="icon"
                    />
                  )}
                </div>
              </div>

              <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600/70 dark:text-teal-400/70" />
                <span className="truncate">
                  {via.bairro ? `${via.bairro} — ` : ''}{via.municipio} / {via.estado}
                </span>
              </CardDescription>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Extensão: {via.extensaoKm.toFixed(2)} km
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                  <Milestone className="h-3 w-3 text-amber-500" />
                  {via.estacas || 'N/D'}
                </span>
              </div>
            </CardHeader>

            <CardFooter className="flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40 py-2.5 px-5 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-800/40 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200 transition-all duration-350 ease-in-out">
                {via._count.trechos} {via._count.trechos === 1 ? 'Trecho' : 'Trechos'}
              </span>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs font-semibold hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50/50 transition-all duration-350 ease-in-out">
                <Link href={`/dashboard-engenheiro/vias/${via.id}`}>
                  Ver Detalhes
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ViasClientList;