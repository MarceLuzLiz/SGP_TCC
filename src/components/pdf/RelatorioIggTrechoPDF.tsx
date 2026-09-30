import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { formatKmToStakes } from '@/lib/formatters';
import { sortFotosByEstaca } from '@/lib/utils/photoOrder';
import { DEFEITOS_DNIT, gerarTabelaEstacas, ResultadoTabelaEstacas } from '@/lib/utils/tabelaEstacas';

type FotoCompleta = Foto & { patologia: Patologia | null; rdsOcorrencia: RdsOcorrencia | null };

export interface DadosIggTrechoPDF {
  titulo: string;
  viaNome: string;
  trechoNome: string;
  kmInicial: number;
  kmFinal: number;
  nCalculado: number;
  totalEstacas: number;
  dataVistoria: Date;
  criadoPor: string;
  iggTotal: number;
  tabelaCalculo: { patologia: string; fa: number; fr: number; fp: number; igi: number }[];
  tabelaPatologias: { nome: string; codigo: string; quantidade: number }[];
  fotos: FotoCompleta[];
  logoUrl: string;
  tabelaEstacas?: ResultadoTabelaEstacas;
}

const getIggRating = (igg: number) => {
  if (igg <= 20) return { label: 'ÓTIMO', color: '#16a34a' };
  if (igg <= 40) return { label: 'BOM', color: '#2563eb' };
  if (igg <= 80) return { label: 'REGULAR', color: '#ca8a04' };
  if (igg <= 160) return { label: 'RUIM', color: '#dc2626' };
  return { label: 'PÉSSIMO', color: '#7f1d1d' };
};

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  landscapePage: { padding: 25, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 10, marginBottom: 10 },
  landscapeHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#334155', paddingBottom: 6, marginBottom: 8 },
  logo: { width: 55, height: 55, marginRight: 15 },
  landscapeLogo: { width: 40, height: 40, marginRight: 12 },
  headerInfo: { flexDirection: 'column', flex: 1 },
  title: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  subTitle: { fontSize: 9, color: '#444', marginTop: 2 },
  
  // Tabelas
  tableContainer: { marginTop: 8, marginBottom: 14 },
  tableHeader: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, color: '#222' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf', minHeight: 18, alignItems: 'center' },
  tableHeaderRow: { backgroundColor: '#f0f0f0' },
  tableCol: { borderRightWidth: 1, borderRightColor: '#bfbfbf', padding: 3 },
  tableCell: { fontSize: 8 },
  
  // IGG Box
  iggBox: { alignSelf: 'center', padding: 8, borderWidth: 1, borderStyle: 'solid', borderColor: '#000', marginTop: 6, marginBottom: 12, alignItems: 'center', minWidth: 140 },
  iggTitle: { fontSize: 9, fontWeight: 'bold' },
  iggValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iggStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 3, textTransform: 'uppercase' },

  // Matriz DNIT por Estaca (Landscape)
  matrixTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#0f172a', textTransform: 'uppercase' },
  matrixTable: { width: 786, borderWidth: 1, borderColor: '#000000' },
  matrixRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', minHeight: 14, alignItems: 'center' },
  matrixHeaderRow: { backgroundColor: '#f8fafc', minHeight: 14 },
  matrixHeaderCell: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#94a3b8', padding: 1.5 },
  matrixCell: { fontSize: 6.5, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', padding: 1 },

  // Fotos
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  imageWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  card: {
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    minHeight: 265,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: 2,
  },
  cardContent: {
    fontSize: 9,
    flex: 1,
    justifyContent: 'space-between',
  },
  
  footer: { position: 'absolute', bottom: 25, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 },
  landscapeFooter: { position: 'absolute', bottom: 15, left: 25, right: 25, fontSize: 7.5, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 4 },
});

export const RelatorioIggTrechoPDF = (props: DadosIggTrechoPDF) => {
  const rating = getIggRating(props.iggTotal);
  const extensaoKm = props.kmFinal - props.kmInicial;
  const fotosOrdenadas = sortFotosByEstaca(props.fotos);

  const tabelaEstacas = props.tabelaEstacas || gerarTabelaEstacas(props.nCalculado, [
    {
      trechoNome: props.trechoNome,
      kmInicial: props.kmInicial,
      kmFinal: props.kmFinal,
      fotos: fotosOrdenadas,
    },
  ]);

  return (
    <Document>
      {/* PÁGINA 1: RESUMO IGG DO TRECHO */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{props.titulo}</Text>
            <Text style={styles.subTitle}>Via: {props.viaNome} | Trecho: {props.trechoNome}</Text>
            <Text style={styles.subTitle}>
              Extensão: {extensaoKm.toFixed(2)} km (Km {props.kmInicial.toFixed(2)} ao {props.kmFinal.toFixed(2)}) | Nº de estacas ({formatKmToStakes(extensaoKm)})
            </Text>
            <Text style={styles.subTitle}>
              Data Vistoria: {new Date(props.dataVistoria).toLocaleDateString('pt-BR')} | Responsável: {props.criadoPor}
            </Text>
          </View>
        </View>

        {/* Resultado IGG */}
        <View style={styles.iggBox}>
          <Text style={styles.iggTitle}>IGG DO TRECHO</Text>
          <Text style={styles.iggValue}>{props.iggTotal.toFixed(2)}</Text>
          <Text style={[styles.iggStatus, { color: rating.color }]}>
            {rating.label}
          </Text>
        </View>

        <View style={{ marginTop: 4, marginBottom: 8, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 8.5, color: '#444', fontStyle: 'italic' }}>
            * Cálculo baseado em {props.nCalculado} estações de amostragem de 20m (n = {props.nCalculado}).
          </Text>
        </View>

        {/* Tabela Quantitativa */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableHeader}>Quantitativo de Patologias</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <View style={[styles.tableCol, { width: '70%' }]}><Text style={styles.tableCell}>Patologia</Text></View>
              <View style={[styles.tableCol, { width: '30%', borderRightWidth: 0 }]}><Text style={styles.tableCell}>Qtd (Fa)</Text></View>
            </View>
            {props.tabelaPatologias.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}><Text style={styles.tableCell}>{row.nome} ({row.codigo})</Text></View>
                <View style={[styles.tableCol, { width: '30%', borderRightWidth: 0 }]}><Text style={styles.tableCell}>{row.quantidade}</Text></View>
              </View>
            ))}
          </View>
        </View>

        {/* Tabela Memória */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableHeader}>Memória de Cálculo</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>Patologia</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fa</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fr (%)</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fp</Text></View>
              <View style={[styles.tableCol, { width: '15%', borderRightWidth: 0 }]}><Text style={styles.tableCell}>IGI</Text></View>
            </View>
            {props.tabelaCalculo.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{row.patologia}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fa}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fr}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fp}</Text></View>
                <View style={[styles.tableCol, { width: '15%', borderRightWidth: 0 }]}><Text style={styles.tableCell}>{row.igi}</Text></View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Relatório IGG do Trecho - Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* PÁGINA 2: PLANILHA DE CAMPO POR ESTACA (LANDSCAPE DNIT) */}
      <Page size="A4" orientation="landscape" style={styles.landscapePage}>
        <View style={styles.landscapeHeader}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {props.logoUrl && <Image style={styles.landscapeLogo} src={props.logoUrl} />}
          <View style={styles.headerInfo}>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{props.titulo} - PLANILHA DE CAMPO POR ESTACA</Text>
            <Text style={{ fontSize: 8, color: '#444' }}>
              Via: {props.viaNome} | Trecho: {props.trechoNome} | {props.nCalculado} estações de 20m | Vistoria: {new Date(props.dataVistoria).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        <Text style={styles.matrixTitle}>
          Levantamento Contínuo de Patologias por Estaca (Norma DNIT 006/2003 - PRO)
        </Text>

        <View style={styles.matrixTable}>
          {/* Nível 1: Super-categorias */}
          <View style={[styles.matrixRow, styles.matrixHeaderRow]} fixed>
            <Text style={[styles.matrixHeaderCell, { width: 46 }]}>Estaca/km</Text>
            <Text style={[styles.matrixHeaderCell, { width: 35 }]}>Seção</Text>
            <Text style={[styles.matrixHeaderCell, { width: 25, color: '#16a34a' }]}>OK</Text>
            <Text style={[styles.matrixHeaderCell, { width: 340, backgroundColor: '#2563eb', color: '#ffffff' }]}>
              TRINCAS
            </Text>
            <Text style={[styles.matrixHeaderCell, { width: 136, backgroundColor: '#d97706', color: '#ffffff' }]}>
              AFUNDAMENTOS
            </Text>
            <Text style={[styles.matrixHeaderCell, { width: 204, backgroundColor: '#334155', color: '#ffffff', borderRightWidth: 0 }]}>
              OUTROS DEFEITOS
            </Text>
          </View>

          {/* Nível 2: Sub-grupos */}
          <View style={[styles.matrixRow, styles.matrixHeaderRow]} fixed>
            <Text style={[styles.matrixHeaderCell, { width: 46 }]}></Text>
            <Text style={[styles.matrixHeaderCell, { width: 35 }]}></Text>
            <Text style={[styles.matrixHeaderCell, { width: 25 }]}></Text>
            <Text style={[styles.matrixHeaderCell, { width: 204, backgroundColor: '#dbeafe', color: '#1e3a8a' }]}>ISOLADAS</Text>
            <Text style={[styles.matrixHeaderCell, { width: 68, backgroundColor: '#bfdbfe', color: '#1e3a8a' }]}>FC-2</Text>
            <Text style={[styles.matrixHeaderCell, { width: 68, backgroundColor: '#93c5fd', color: '#1e3a8a' }]}>FC-3</Text>
            <Text style={[styles.matrixHeaderCell, { width: 68, backgroundColor: '#fef3c7', color: '#78350f' }]}>PLÁSTICO</Text>
            <Text style={[styles.matrixHeaderCell, { width: 68, backgroundColor: '#fde68a', color: '#78350f' }]}>CONSOLIDAÇÃO</Text>
            <Text style={[styles.matrixHeaderCell, { width: 204, backgroundColor: '#e2e8f0', color: '#1e293b', borderRightWidth: 0 }]}>DIVERSOS</Text>
          </View>

          {/* Nível 3: Códigos + Tipo */}
          <View style={[styles.matrixRow, styles.matrixHeaderRow, { minHeight: 18 }]} fixed>
            <Text style={[styles.matrixHeaderCell, { width: 46, fontSize: 6 }]}>Est.</Text>
            <Text style={[styles.matrixHeaderCell, { width: 35, fontSize: 6 }]}>Pista</Text>
            <Text style={[styles.matrixHeaderCell, { width: 25, fontSize: 6 }]}>-</Text>
            {DEFEITOS_DNIT.map((d, i) => (
              <Text
                key={d.codigo}
                style={[
                  styles.matrixHeaderCell,
                  { width: 34, fontSize: 6, borderRightWidth: i === 19 ? 0 : 1 },
                ]}
              >
                {`${d.codigo}\n${d.tipo}`}
              </Text>
            ))}
          </View>

          {/* Linhas de Dados */}
          {tabelaEstacas.linhas.map((l) => (
            <View key={l.numero} style={styles.matrixRow} wrap={false}>
              <Text style={[styles.matrixCell, { width: 46, fontWeight: 'bold' }]}>{l.label}</Text>
              <Text style={[styles.matrixCell, { width: 35 }]}>{l.secaoTerrap}</Text>
              <Text style={[styles.matrixCell, { width: 25, color: '#16a34a', fontWeight: 'bold' }]}>
                {l.ok ? 'X' : ''}
              </Text>
              {DEFEITOS_DNIT.map((d, i) => (
                <Text
                  key={d.codigo}
                  style={[
                    styles.matrixCell,
                    {
                      width: 34,
                      fontWeight: l.defeitos[d.codigo] ? 'bold' : 'normal',
                      backgroundColor: l.defeitos[d.codigo] ? '#fee2e2' : '#ffffff',
                      color: l.defeitos[d.codigo] ? '#b91c1c' : '#000000',
                      borderRightWidth: i === 19 ? 0 : 1,
                    },
                  ]}
                >
                  {l.defeitos[d.codigo] ? 'X' : ''}
                </Text>
              ))}
            </View>
          ))}

          {/* Rodapé Somatório */}
          <View style={[styles.matrixRow, { backgroundColor: '#f1f5f9', borderTopWidth: 2, borderTopColor: '#000000' }]} wrap={false}>
            <Text style={[styles.matrixHeaderCell, { width: 46 }]}>Total (Fa)</Text>
            <Text style={[styles.matrixHeaderCell, { width: 35 }]}>-</Text>
            <Text style={[styles.matrixHeaderCell, { width: 25, color: '#16a34a' }]}>
              {tabelaEstacas.totais.totalEstacasOk}
            </Text>
            {DEFEITOS_DNIT.map((d, i) => {
              const qtd = tabelaEstacas.totais.totaisPorCodigo[d.codigo] || 0;
              return (
                <Text
                  key={d.codigo}
                  style={[
                    styles.matrixHeaderCell,
                    {
                      width: 34,
                      fontWeight: 'bold',
                      color: qtd > 0 ? '#1e40af' : '#64748b',
                      borderRightWidth: i === 19 ? 0 : 1,
                    },
                  ]}
                >
                  {qtd > 0 ? qtd : '-'}
                </Text>
              );
            })}
          </View>
        </View>

        <Text style={{ fontSize: 7, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
          * Legenda: X = Ocorrência do defeito na estaca | OK = Estação sem defeitos identificados | Fa = Frequência Absoluta
        </Text>

        <Text style={styles.landscapeFooter} render={({ pageNumber, totalPages }) => (
          `Relatório IGG do Trecho - Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>

      {/* PÁGINA 3+: EVIDÊNCIAS FOTOGRÁFICAS */}
      {fotosOrdenadas.length > 0 && (
        <Page size="A4" orientation="portrait" style={styles.page}>
          <View style={styles.header} fixed>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{props.titulo} - Evidências Fotográficas</Text>
              <Text style={styles.subTitle}>Via: {props.viaNome} | Trecho: {props.trechoNome}</Text>
            </View>
          </View>

          <Text style={[styles.tableHeader, { marginTop: 10, marginBottom: 10 }]}>Evidências Fotográficas</Text>
          
          <View style={styles.grid}>
            {fotosOrdenadas.map((foto) => (
              <View key={foto.id} style={styles.card} wrap={false}>
                <View style={styles.imageWrapper}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image style={styles.image} src={foto.imageUrl} />
                </View>
                <View style={styles.cardContent}>
                  <View>
                    <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{foto.patologia?.classificacaoEspecifica}</Text>
                    <Text style={{ fontSize: 8 }}>Cód: {foto.patologia?.codigoDnit} | IGG: {foto.patologia?.mapeamentoIgg}</Text>
                  </View>
                  <Text style={{ fontSize: 7, color: '#888', marginTop: 4 }}>Estaca: {foto.estaca || 'N/D'}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
            `Relatório IGG do Trecho - Página ${pageNumber} de ${totalPages}`
          )} fixed />
        </Page>
      )}
    </Document>
  );
};