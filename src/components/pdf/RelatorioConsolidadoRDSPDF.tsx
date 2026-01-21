import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';

type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

// Dados específicos do RDS
interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

export interface TrechoRDSData {
  nome: string;
  kmInicial: number;
  kmFinal: number;
  dataVistoria: Date;
  fotos: FotoCompleta[];
  dadosRDS: DadosRDS; // <-- DADOS DO RDS
}

interface RelatorioConsolidadoRDSPDFProps {
  titulo: string;
  viaNome: string;
  dataGeracao: Date;
  trechos: TrechoRDSData[];
  logoUrl: string;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 10, marginBottom: 20 },
  logo: { width: 60, height: 60, marginRight: 15 },
  headerInfo: { flexDirection: 'column', flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  subTitle: { fontSize: 10, color: '#444', marginBottom: 2 },
  
  trechoSection: { marginBottom: 15, marginTop: 10 },
  trechoHeader: { backgroundColor: '#e0e0e0', padding: 5, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' },
  trechoTitle: { fontSize: 11, fontWeight: 'bold' },
  
  // Info Box RDS
  rdsBox: { backgroundColor: '#f8f9fa', padding: 8, marginBottom: 10, borderRadius: 4 },
  rdsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rdsText: { fontSize: 9, color: '#333' },
  rdsLabel: { fontWeight: 'bold', fontSize: 9 },
  rdsBlock: { marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: 10, borderWidth: 1, borderColor: '#ddd', padding: 5, height: 230 },
  image: { width: '100%', height: 140, objectFit: 'cover', marginBottom: 5 },
  cardContent: { fontSize: 9 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
});

export const RelatorioConsolidadoRDSPDF = ({
  titulo, viaNome, dataGeracao, trechos, logoUrl
}: RelatorioConsolidadoRDSPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{titulo}</Text>
            <Text style={styles.subTitle}>Via: {viaNome}</Text>
            <Text style={styles.subTitle}>Gerado em: {new Date(dataGeracao).toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        {trechos.map((trecho, tIndex) => (
          <View key={tIndex} style={styles.trechoSection} break={tIndex > 0}>
            <View style={styles.trechoHeader}>
              <Text style={styles.trechoTitle}>{trecho.nome}</Text>
              <Text style={{fontSize: 9}}>Km {trecho.kmInicial} - {trecho.kmFinal}</Text>
            </View>

            {/* DADOS RDS DO TRECHO */}
            <View style={styles.rdsBox}>
              <View style={styles.rdsRow}>
                <Text style={styles.rdsText}><Text style={styles.rdsLabel}>Data:</Text> {new Date(trecho.dataVistoria).toLocaleDateString('pt-BR')}</Text>
                <Text style={styles.rdsText}><Text style={styles.rdsLabel}>Clima:</Text> {trecho.dadosRDS.clima || '-'}</Text>
                <Text style={styles.rdsText}><Text style={styles.rdsLabel}>Entrada:</Text> {trecho.dadosRDS.horarioEntrada || '-'}  <Text style={styles.rdsLabel}>Saída:</Text> {trecho.dadosRDS.horarioSaida || '-'}</Text>
              </View>
              <View style={styles.rdsBlock}>
                <Text style={styles.rdsLabel}>Anotações:</Text>
                <Text style={styles.rdsText}>{trecho.dadosRDS.anotacoes || 'Nenhuma.'}</Text>
              </View>
              <View style={styles.rdsBlock}>
                <Text style={styles.rdsLabel}>Ocorrências:</Text>
                <Text style={styles.rdsText}>{trecho.dadosRDS.ocorrencias || 'Nenhuma.'}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              {trecho.fotos.map((foto) => (
                <View key={foto.id} style={styles.card} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image style={styles.image} src={foto.imageUrl} />
                  <View style={styles.cardContent}>
                    <Text style={{fontWeight: 'bold', marginBottom: 2}}>{foto.rdsOcorrencia?.ocorrencia}</Text>
                    <Text style={{fontSize: 8, color: '#555'}}>Cat: {foto.rdsOcorrencia?.categoria}</Text>
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
          `Relatório RDS Consolidado - Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};