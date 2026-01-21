import Link from 'next/link';
import { getViasComContagemTrechos } from '@/lib/data/engenheiro';
import { ViasClientList } from './_components/ViasClientList';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ViasListPage() {
  // 1. Busca os dados no servidor (rápido e SEO-friendly)
  const vias = await getViasComContagemTrechos();

  // 2. Renderiza o componente cliente que tem a interatividade
  return <ViasClientList initialVias={vias} />;
}