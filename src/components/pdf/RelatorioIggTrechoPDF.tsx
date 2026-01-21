import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { formatKmToStakes } from '@/lib/formatters';

type FotoCompleta = Foto & { patologia: Patologia | null; rdsOcorrencia: RdsOcorrencia | null };

interface DadosIggTrechoPDF {
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
  header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 10, marginBottom: 10 },
  logo: { width: 60, height: 60, marginRight: 15 },
  headerInfo: { flexDirection: 'column', flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  subTitle: { fontSize: 10, color: '#444', marginTop: 2 },
  
  // IGG Box
  iggBox: { alignSelf: 'center', padding: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#000', marginTop: 10, marginBottom: 20, alignItems: 'center', minWidth: 150 },
  iggTitle: { fontSize: 10, fontWeight: 'bold' },
  iggValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  iggStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },

  // Tabelas
  tableContainer: { marginTop: 10, marginBottom: 20 },
  tableHeader: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#222' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf', minHeight: 20, alignItems: 'center' },
  tableHeaderRow: { backgroundColor: '#f0f0f0' },
  tableCol: { borderRightWidth: 1, borderRightColor: '#bfbfbf', padding: 4 },
  tableCell: { fontSize: 8 },

  // Fotos
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  card: { width: '48%', marginBottom: 10, borderWidth: 1, borderColor: '#ddd', padding: 5, height: 230 },
  image: { width: '100%', height: 140, objectFit: 'cover', marginBottom: 5 },
  cardContent: { fontSize: 9 },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
});

export const RelatorioIggTrechoPDF = (props: DadosIggTrechoPDF) => {
  // Calcula o conceito
  const rating = getIggRating(props.iggTotal);

  const extensaoKm = Math.abs(props.kmFinal - props.kmInicial);

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{props.titulo}</Text>
          <Text style={styles.subTitle}>Via: {props.viaNome} | Trecho: {props.trechoNome}</Text>

          <Text style={styles.subTitle}>
               Localização: Est. {formatKmToStakes(props.kmInicial)} até Est. {formatKmToStakes(props.kmFinal)}
            </Text>

          <Text style={styles.subTitle}>
               Extensão: {extensaoKm.toFixed(3)} km
            </Text>
            
          <Text style={styles.subTitle}>
             Vistoria: {new Date(props.dataVistoria).toLocaleDateString('pt-BR')} | Resp: {props.criadoPor}
          </Text>
        </View>
      </View>

      <View style={styles.iggBox}>
          <Text style={styles.iggTitle}>IGG DO TRECHO</Text>
          <Text style={styles.iggValue}>{props.iggTotal.toFixed(2)}</Text>
          <Text style={[styles.iggStatus, { color: rating.color }]}>
            {rating.label}
          </Text>
        </View>

        <View style={{ marginTop: 10, marginBottom: 5, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>
            * Cálculo baseado em {props.nCalculado} (n = {props.nCalculado}).
          </Text>
        </View>

      {/* Tabela Quantitativa */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableHeader}>Quantitativo</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
             <View style={[styles.tableCol, { width: '70%' }]}><Text style={styles.tableCell}>Patologia</Text></View>
             <View style={[styles.tableCol, { width: '30%', borderRight: 0 }]}><Text style={styles.tableCell}>Qtd (Fa)</Text></View>
          </View>
          {props.tabelaPatologias.map((row, i) => (
            <View key={i} style={styles.tableRow}>
               <View style={[styles.tableCol, { width: '70%' }]}><Text style={styles.tableCell}>{row.nome} ({row.codigo})</Text></View>
               <View style={[styles.tableCol, { width: '30%', borderRight: 0 }]}><Text style={styles.tableCell}>{row.quantidade}</Text></View>
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
            <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fr</Text></View>
            <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCell}>Fp</Text></View>
            <View style={[styles.tableCol, { width: '15%', borderRight: 0 }]}><Text style={styles.tableCell}>IGI</Text></View>
          </View>
          {props.tabelaCalculo.map((row, i) => (
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

      <View break>

      <Text style={[styles.tableHeader, {marginTop: 20}]}>Evidências Fotográficas</Text>
      
      <View style={styles.grid}>
          {props.fotos.map((foto) => (
            <View key={foto.id} style={styles.card} wrap={false}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.image} src={foto.imageUrl} />
              <View style={styles.cardContent}>
                <Text style={{fontWeight: 'bold', marginBottom: 2}}>{foto.patologia?.classificacaoEspecifica}</Text>
                <Text style={{fontSize: 8}}>Cód: {foto.patologia?.codigoDnit} | IGG: {foto.patologia?.mapeamentoIgg}</Text>
                <Text style={{fontSize: 7, color: '#888', marginTop: 4}}>Estaca: {foto.estaca || 'N/D'}</Text>
              </View>
            </View>
          ))}
      </View>
      </View>

      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Relatório IGG do Trecho - Página ${pageNumber} de ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);
};