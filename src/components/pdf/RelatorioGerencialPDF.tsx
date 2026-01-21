import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { formatKmToStakes } from '@/lib/formatters';

// ... (Copie os tipos de DadosGerenciais do arquivo gerencial.ts ou importe se possível)
// Para garantir, vou redefinir aqui para o componente
type FotoCompleta = Foto & { patologia: Patologia | null; rdsOcorrencia: RdsOcorrencia | null };

interface DadosGerenciaisPDF {
  iggTotal: number;
  tabelaPatologias: { nome: string; codigo: string; quantidade: number; trechosAfetados: number; }[];
  tabelaCalculo: { patologia: string; fa: number; fr: number; fp: number; igi: number; }[];
  viaName: string;
  viaEstacas: string | null;
  extensaoKm: number;
  totalPatologias: number;
  fotosPorTrecho: {
    trechoNome: string;
    kmInicial: number;
    kmFinal: number;
    dataVistoria: Date;
    fotos: FotoCompleta[];
  }[];
  totalEstacoesConsideradas: number;
}

interface Props {
  dados: DadosGerenciaisPDF;
  titulo: string;
  dataGeracao: Date;
  criadoPor: string;
  logoUrl: string;
}

const getIggRating = (igg: number) => {
  if (igg <= 20) return { label: 'ÓTIMO', color: '#16a34a' }; // Verde
  if (igg <= 40) return { label: 'BOM', color: '#2563eb' };   // Azul
  if (igg <= 80) return { label: 'REGULAR', color: '#ca8a04' }; // Amarelo Escuro
  if (igg <= 160) return { label: 'RUIM', color: '#dc2626' };   // Vermelho
  return { label: 'PÉSSIMO', color: '#7f1d1d' }; // Vermelho Escuro
};

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 10, marginBottom: 10 },
  logo: { width: 60, height: 60, marginRight: 15 },
  headerInfo: { flexDirection: 'column', flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  subTitle: { fontSize: 10, color: '#444', marginTop: 2 },
  
  // Tabelas
  tableContainer: { marginTop: 10, marginBottom: 20 },
  tableHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#222' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf', minHeight: 20, alignItems: 'center' },
  tableHeaderRow: { backgroundColor: '#f0f0f0' },
  tableCol: { borderRightWidth: 1, borderRightColor: '#bfbfbf', padding: 4 },
  tableCell: { fontSize: 8 },
  
  // IGG Box
  iggBox: { alignSelf: 'center', padding: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#000', marginTop: 10, marginBottom: 20, alignItems: 'center', minWidth: 150 },
  iggTitle: { fontSize: 10, fontWeight: 'bold' },
  iggValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  iggStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },

  // Fotos
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5, backgroundColor: '#e0e0e0', padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: 10, borderWidth: 1, borderColor: '#ddd', padding: 5, height: 230 },
  image: { width: '100%', height: 140, objectFit: 'cover', marginBottom: 5 },
  cardContent: { fontSize: 9 },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
});

export const RelatorioGerencialPDF = ({ dados, titulo, dataGeracao, criadoPor, logoUrl }: Props) => {
  // Calcula o conceito
  const rating = getIggRating(dados.iggTotal);

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {logoUrl && <Image style={styles.logo} src={logoUrl} />}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.subTitle}>Via: {dados.viaName}</Text>

          <Text style={styles.subTitle}>
               Extensão Total: {dados.extensaoKm.toFixed(2)} km | Nº de estacas ({formatKmToStakes(dados.extensaoKm)})
            </Text>
          
          <Text style={styles.subTitle}>
            Gerado em: {new Date(dataGeracao).toLocaleDateString('pt-BR')} | Responsável: {criadoPor} {/* <-- 2. EXIBIÇÃO */}
          </Text>
        </View>
      </View>

      {/* 1. RESULTADO IGG */}
      <View style={styles.iggBox}>
          <Text style={styles.iggTitle}>IGG DA VIA</Text>
          <Text style={styles.iggValue}>{dados.iggTotal.toFixed(2)}</Text>
          {/* Texto Colorido do Conceito */}
          <Text style={[styles.iggStatus, { color: rating.color }]}>
            {rating.label}
          </Text>
        </View>

        <View style={{ marginTop: 10, marginBottom: 5, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
            * IGG calculado considerando a extensão total da via: {dados.totalEstacoesConsideradas} estações (n = {dados.totalEstacoesConsideradas}).
          </Text>
        </View>

      {/* 2. TABELA QUANTITATIVA */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableHeader}>Quantitativo de Patologias</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableCol, { width: '50%' }]}><Text style={styles.tableCell}>Patologia</Text></View>
            <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCell}>Quantidade (Fa)</Text></View>
            <View style={[styles.tableCol, { width: '25%', borderRight: 0 }]}><Text style={styles.tableCell}>Trechos</Text></View>
          </View>
          {dados.tabelaPatologias.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '50%' }]}><Text style={styles.tableCell}>{row.nome} ({row.codigo})</Text></View>
              <View style={[styles.tableCol, { width: '25%' }]}><Text style={styles.tableCell}>{row.quantidade}</Text></View>
              <View style={[styles.tableCol, { width: '25%', borderRight: 0 }]}><Text style={styles.tableCell}>{row.trechosAfetados}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* 3. TABELA MEMÓRIA */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableHeader}>Memória de Cálculo</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>Patologia</Text></View>
            <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fa</Text></View>
            <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fr</Text></View>
            <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fp</Text></View>
            <View style={[styles.tableCol, { width: '15%', borderRight: 0 }]}><Text style={styles.tableCell}>IGI</Text></View>
          </View>
          {dados.tabelaCalculo.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{row.patologia}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fa}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fr}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>{row.fp}</Text></View>
              <View style={[styles.tableCol, { width: '15%', borderRight: 0 }]}><Text style={styles.tableCell}>{row.igi}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. FOTOS POR TRECHO (Quebra de página automática) */}
      
      {dados.fotosPorTrecho.map((trecho, i) => (
        <View key={i} break>
        <Text style={[styles.tableHeader, {marginTop: 20}]}>Detalhamento Fotográfico</Text> 
           <Text style={styles.sectionTitle}>
             {trecho.trechoNome} (Km {trecho.kmInicial} - {trecho.kmFinal})
           </Text>
           <Text style={{fontSize: 9, marginBottom: 10, color: '#555'}}>
             Vistoria Ref: {new Date(trecho.dataVistoria).toLocaleDateString('pt-BR')}
           </Text>

           <View style={styles.grid}>
             {trecho.fotos.map((foto) => (
                <View key={foto.id} style={styles.card} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image style={styles.image} src={foto.imageUrl} />
                  <View style={styles.cardContent}>
                    <Text style={{fontWeight: 'bold', marginBottom: 2}}>
                      {foto.patologia?.classificacaoEspecifica}
                    </Text>
                    <Text style={{fontSize: 8}}>
                      Cód: {foto.patologia?.codigoDnit} | IGG: {foto.patologia?.mapeamentoIgg}
                    </Text>
                    <Text style={{marginTop: 4, color: '#444', fontSize: 8}}>
                      {foto.descricao ? (foto.descricao.length > 70 ? foto.descricao.substring(0, 70) + '...' : foto.descricao) : '-'}
                    </Text>
                    <Text style={{fontSize: 7, color: '#888', marginTop: 'auto'}}>Estaca: {foto.estaca || 'N/D'}</Text>
                  </View>
                </View>
             ))}
           </View>
        </View>
      ))}

      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Relatório Gerencial da Via - Página ${pageNumber} de ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);
};