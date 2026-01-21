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
import { PlusCircle, Search } from 'lucide-react';

// Tipo inferido da sua função de backend (ou defina manualmente se preferir)
interface ViaData {
  id: string;
  name: string;
  bairro: string;
  municipio: string;
  estado: string;
  extensaoKm: number;
  estacas: string | null;
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
    via.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vias & Trechos</h1>
          <p className="text-muted-foreground">
            Gerencie e analise as vias cadastradas no sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard-engenheiro/vias/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Nova Via
          </Link>
        </Button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar via por nome..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* GRID DE CARDS */}
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVias.length === 0 && (
          <div className="col-span-full py-10 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? `Nenhuma via encontrada para "${searchQuery}".`
                : 'Nenhuma via cadastrada ainda.'}
            </p>
          </div>
        )}

        {filteredVias.map((via) => (
          <Card key={via.id} className="flex flex-col justify-between transition-all hover:border-blue-800/50">
            <CardHeader>
              <CardTitle className="line-clamp-1" title={via.name}>
                {via.name}
              </CardTitle>
              <CardDescription>
                {via.municipio} - {via.estado}
              </CardDescription>
              <div className="flex flex-col gap-1 pt-1 text-sm text-muted-foreground">
                <span>Extensão: {via.extensaoKm.toFixed(2)} km</span>
                <span className="text-xs">Estacas: {via.estacas || 'N/D'}</span>
              </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center bg-muted/20 pt-1">
              <span className="text-sm font-medium text-muted-foreground">
                {via._count.trechos} Trecho(s)
              </span>
              <Button asChild variant="outline" size="sm">
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