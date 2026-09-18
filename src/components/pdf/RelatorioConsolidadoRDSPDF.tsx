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
  card: { 
    width: '48%', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderRadius: 4, 
    padding: 6, 
    minHeight: 225, 
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },
  imageWrapper: {
    width: '100%',
    height: 135,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  image: { width: '100%', height: '100%', objectFit: 'contain' },
  cardContent: { 
    fontSize: 9, 
    flex: 1, 
    flexDirection: 'column', 
    justifyContent: 'space-between' 
  },
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
                  <View style={styles.imageWrapper}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={styles.image} src={foto.imageUrl} />
                  </View>
                  <View style={styles.cardContent}>
                    <View>
                      <Text style={{fontWeight: 'bold', fontSize: 9, marginBottom: 2, color: '#0f172a'}}>
                        {foto.rdsOcorrencia?.ocorrencia || 'Ocorrência Geral'}
                      </Text>
                      <Text style={{fontSize: 7.5, color: '#475569'}}>
                        Cat: {foto.rdsOcorrencia?.categoria || 'N/A'}
                      </Text>
                      <Text style={{marginTop: 3, color: '#334155', fontSize: 7.5, lineHeight: 1.2}}>
                        {foto.descricao ? (foto.descricao.length > 70 ? foto.descricao.substring(0, 70) + '...' : foto.descricao) : '-'}
                      </Text>
                    </View>
                    <View style={{marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={{fontSize: 7, color: '#64748b'}}>
                        {new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}
                      </Text>
                      <Text style={{fontSize: 7, fontWeight: 'bold', color: '#0f766e'}}>
                        Estaca: {foto.estaca || 'N/D'}
                      </Text>
                    </View>
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