'use client';

import React, { useState, useMemo } from 'react';
import {
  DEFEITOS_DNIT,
  LinhaEstaca,
  TotaisDefeitosEstaca,
} from '@/lib/utils/tabelaEstacas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Layers, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface TabelaPatologiasEstacaProps {
  linhas: LinhaEstaca[];
  totais: TotaisDefeitosEstaca;
  viaNome?: string;
  className?: string;
}

export function TabelaPatologiasEstaca({
  linhas,
  totais,
  viaNome,
  className = '',
}: TabelaPatologiasEstacaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'com_defeito' | 'ok'>('todos');

  // Filtragem interativa
  const linhasFiltradas = useMemo(() => {
    return linhas.filter((linha) => {
      // Filtro de status
      if (filtroStatus === 'com_defeito' && linha.ok) return false;
      if (filtroStatus === 'ok' && !linha.ok) return false;

      // Filtro de busca
      if (!searchTerm) return true;
      const term = searchTerm.trim().toLowerCase();
      const numMatch = linha.numero.toString() === term;
      const labelMatch = linha.label.toLowerCase().includes(term);
      const secaoMatch = linha.secaoTerrap.toLowerCase().includes(term);
      
      // Também permite buscar pelo código da patologia na estaca (ex: "ATP", "D", "R")
      const temPatologiaBuscada = Object.entries(linha.defeitos).some(
        ([cod, hasDefect]) => hasDefect && cod.toLowerCase().includes(term)
      );

      return numMatch || labelMatch || secaoMatch || temPatologiaBuscada;
    });
  }, [linhas, searchTerm, filtroStatus]);

  return (
    <Card className={`overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">
                Levantamento Contínuo por Estaca (DNIT 006/2003 - PRO)
              </CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Mapeamento de ocorrências de patologias em cada estação de amostragem de 20 metros.
              {viaNome ? ` Referência: ${viaNome}` : ''}
            </CardDescription>
          </div>

          {/* Badges de resumo */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs px-2.5 py-1">
              <span className="font-semibold text-foreground mr-1">{linhas.length}</span> Estações
            </Badge>
            <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 text-xs px-2.5 py-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              <span className="font-semibold mr-1">{totais.totalEstacasComDefeito}</span> com Patologias
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span className="font-semibold mr-1">{totais.totalEstacasOk}</span> OK (Sem Defeito)
            </Badge>
            <Badge variant="secondary" className="text-xs px-2.5 py-1">
              Total Fa: <span className="font-bold ml-1">{totais.totalOcorrencias}</span>
            </Badge>
          </div>
        </div>

        {/* Barra de Ferramentas / Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filtrar por estaca ou patologia (ex: 7, ATP)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                filtroStatus === 'todos'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todas ({linhas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('com_defeito')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                filtroStatus === 'com_defeito'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              Com Defeitos ({totais.totalEstacasComDefeito})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ok')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                filtroStatus === 'ok'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              OK ({totais.totalEstacasOk})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <table className="w-full text-xs text-center border-collapse border-spacing-0 select-text">
            {/* CABEÇALHO COM HIERARQUIA OFICIAL DNIT */}
            <thead className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-xs">
              {/* NÍVEL 1: SUPER-CATEGORIAS */}
              <tr className="border-b border-slate-300 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-800 px-3 py-2 border-r border-slate-300 dark:border-slate-700 min-w-[70px] text-left"
                >
                  Estaca ou km
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[70px] z-40 bg-slate-100 dark:bg-slate-800 px-2 py-2 border-r border-slate-300 dark:border-slate-700 min-w-[55px] text-center"
                >
                  Seção Terrap.
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[125px] z-40 bg-slate-100 dark:bg-slate-800 px-2 py-2 border-r-2 border-slate-300 dark:border-slate-600 min-w-[45px] text-center text-emerald-600 dark:text-emerald-400"
                >
                  OK
                </th>

                {/* TRINCAS (10 Colunas: FI, TTC, TTL, TLC, TLL, TRR, J, TB, JE, TBE) */}
                <th
                  colSpan={10}
                  className="bg-blue-600 text-white py-1.5 px-2 border-r-2 border-blue-700 text-center"
                >
                  TRINCAS
                </th>

                {/* AFUNDAMENTOS (4 Colunas: ALP, ATP, ALC, ATC) */}
                <th
                  colSpan={4}
                  className="bg-amber-600 text-white py-1.5 px-2 border-r-2 border-amber-700 text-center"
                >
                  AFUNDAMENTOS
                </th>

                {/* OUTROS DEFEITOS (6 Colunas: O, P, E, EX, D, R) */}
                <th
                  colSpan={6}
                  className="bg-slate-700 text-white py-1.5 px-2 text-center"
                >
                  OUTROS DEFEITOS
                </th>
              </tr>

              {/* NÍVEL 2: SUB-GRUPOS */}
              <tr className="border-b border-slate-300 dark:border-slate-700 text-[10px] font-semibold">
                {/* Sob TRINCAS */}
                <th colSpan={6} className="bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-r border-blue-200 dark:border-blue-800 py-1">
                  ISOLADAS
                </th>
                <th colSpan={2} className="bg-blue-100/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-r border-blue-200 dark:border-blue-800 py-1">
                  FC-2
                </th>
                <th colSpan={2} className="bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border-r-2 border-blue-300 dark:border-blue-700 py-1">
                  FC-3
                </th>

                {/* Sob AFUNDAMENTOS */}
                <th colSpan={2} className="bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-r border-amber-200 dark:border-amber-800 py-1">
                  PLÁSTICO
                </th>
                <th colSpan={2} className="bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-r-2 border-amber-300 dark:border-amber-700 py-1">
                  CONSOLIDAÇÃO
                </th>

                {/* Sob OUTROS DEFEITOS (ocupa os 6 códigos diretamente) */}
                <th colSpan={6} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1">
                  DIVERSOS (SUPERFÍCIE / ESTRUTURA)
                </th>
              </tr>

              {/* NÍVEL 3: CÓDIGOS DAS PATOLOGIAS COM PESOS (TIPO DNIT) */}
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-[10px]">
                {/* Espaçadores para manter o alinhamento com as 3 colunas sticky */}
                <th className="sticky left-0 z-40 bg-slate-50 dark:bg-slate-800/90 border-r border-slate-300 dark:border-slate-700 py-1 text-muted-foreground font-normal text-left px-3">
                  Código:
                </th>
                <th className="sticky left-[70px] z-40 bg-slate-50 dark:bg-slate-800/90 border-r border-slate-300 dark:border-slate-700 py-1 text-muted-foreground font-normal">
                  Pista
                </th>
                <th className="sticky left-[125px] z-40 bg-slate-50 dark:bg-slate-800/90 border-r-2 border-slate-300 dark:border-slate-600 py-1 text-muted-foreground font-normal">
                  -
                </th>

                {/* 20 Colunas de Patologias */}
                {DEFEITOS_DNIT.map((def, idx) => (
                  <th
                    key={def.codigo}
                    title={`${def.nome} - Tipo ${def.tipo} (Fp = ${def.fp})`}
                    className={`px-1.5 py-1 min-w-[34px] cursor-help transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-700/60 ${
                      idx === 9 || idx === 13 ? 'border-r-2 border-slate-300 dark:border-slate-600' : 'border-r border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-foreground text-[11px]">{def.codigo}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{def.tipo}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* CORPO DA TABELA: UMA LINHA POR ESTACA */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {linhasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={23} className="py-8 text-center text-muted-foreground">
                    Nenhuma estaca encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                linhasFiltradas.map((linha, rowIndex) => {
                  const isEven = rowIndex % 2 === 0;

                  return (
                    <tr
                      key={linha.numero}
                      className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                        isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-900/40'
                      }`}
                    >
                      {/* Coluna 1: Estaca ou km (Sticky) */}
                      <td className="sticky left-0 z-20 bg-inherit px-3 py-1.5 font-bold text-left border-r border-slate-200 dark:border-slate-800 text-foreground whitespace-nowrap">
                        {linha.label}
                      </td>

                      {/* Coluna 2: Seção Terrap. (Sticky) */}
                      <td className="sticky left-[70px] z-20 bg-inherit px-2 py-1.5 font-medium text-center border-r border-slate-200 dark:border-slate-800 text-muted-foreground">
                        {linha.secaoTerrap}
                      </td>

                      {/* Coluna 3: OK (Sticky) */}
                      <td className="sticky left-[125px] z-20 bg-inherit px-2 py-1.5 text-center border-r-2 border-slate-300 dark:border-slate-700">
                        {linha.ok ? (
                          <span className="inline-flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded w-5 h-5 text-[11px] border border-emerald-200 dark:border-emerald-800">
                            X
                          </span>
                        ) : null}
                      </td>

                      {/* 20 Colunas de Patologias */}
                      {DEFEITOS_DNIT.map((def, idx) => {
                        const temDefeito = linha.defeitos[def.codigo];
                        const isBorderSection = idx === 9 || idx === 13;

                        return (
                          <td
                            key={def.codigo}
                            className={`px-1 py-1 text-center ${
                              isBorderSection ? 'border-r-2 border-slate-300 dark:border-slate-700' : 'border-r border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            {temDefeito ? (
                              <span
                                title={`${def.nome} na ${linha.label}`}
                                className="inline-flex items-center justify-center font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/70 rounded w-5 h-5 text-xs transition-colors cursor-pointer"
                              >
                                X
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* RODAPÉ COM SOMATÓRIO (Fa TOTAL POR PATOLOGIA) */}
            <tfoot className="sticky bottom-0 z-30 bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-600 shadow-md">
              <tr className="text-xs">
                <td className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left border-r border-slate-300 dark:border-slate-600 text-foreground whitespace-nowrap">
                  Total (Fa)
                </td>
                <td className="sticky left-[70px] z-40 bg-slate-100 dark:bg-slate-800 px-2 py-2 text-center border-r border-slate-300 dark:border-slate-600 text-muted-foreground">
                  -
                </td>
                <td className="sticky left-[125px] z-40 bg-slate-100 dark:bg-slate-800 px-2 py-2 text-center border-r-2 border-slate-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-400">
                  {totais.totalEstacasOk}
                </td>

                {DEFEITOS_DNIT.map((def, idx) => {
                  const qtd = totais.totaisPorCodigo[def.codigo] || 0;
                  const isBorderSection = idx === 9 || idx === 13;

                  return (
                    <td
                      key={def.codigo}
                      title={`Total Fa de ${def.codigo}: ${qtd}`}
                      className={`px-1 py-2 text-center ${
                        isBorderSection ? 'border-r-2 border-slate-300 dark:border-slate-600' : 'border-r border-slate-200 dark:border-slate-700'
                      } ${qtd > 0 ? 'text-primary font-extrabold bg-primary/5' : 'text-muted-foreground/40'}`}
                    >
                      {qtd > 0 ? qtd : '-'}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* LEGENDA / NOTA TÉCNICA */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>
              <strong>X:</strong> Ocorrência do defeito na estaca | <strong>OK:</strong> Estação sem defeitos identificados | <strong>Fa:</strong> Frequência Absoluta
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Trincas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Afundamentos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" /> Outros Defeitos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
