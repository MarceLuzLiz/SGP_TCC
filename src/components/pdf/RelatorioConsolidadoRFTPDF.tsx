import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';

type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

// Estrutura de dados agrupada
export interface TrechoRFTData {
  nome: string;
  kmInicial: number;
  kmFinal: number;
  dataVistoria: Date;
  fotos: FotoCompleta[];
}

interface RelatorioConsolidadoRFTPDFProps {
  titulo: string;
  viaNome: string;
  dataGeracao: Date;
  criadoPor: string; // Nome do Fiscal ou do Gerador
  trechos: TrechoRFTData[]; // Lista de trechos com suas fotos
  logoUrl: string;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  // Cabeçalho Global (Repete em cada página se usar fixed)
  header: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 10, marginBottom: 20 },
  logo: { width: 60, height: 60, marginRight: 15 },
  headerInfo: { flexDirection: 'column', flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  subTitle: { fontSize: 10, color: '#444', marginBottom: 2 },
  
  // Seção do Trecho
  trechoSection: { marginBottom: 10, marginTop: 10 },
  trechoHeader: { 
    backgroundColor: '#e0e0e0', 
    padding: 5, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  trechoTitle: { fontSize: 11, fontWeight: 'bold' },
  trechoInfo: { fontSize: 9, color: '#555' },

  // Grid de Fotos
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: '48%', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderRadius: 4, 
    padding: 6, 
    minHeight: 265, 
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
    flexDirection: 'column', 
    justifyContent: 'space-between' 
  },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: 'grey', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
});

export const RelatorioConsolidadoRFTPDF = ({
  titulo, viaNome, dataGeracao, criadoPor, trechos, logoUrl
}: RelatorioConsolidadoRFTPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho Fixo em todas as páginas */}
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{titulo}</Text>
            <Text style={styles.subTitle}>Via: {viaNome}</Text>
            <Text style={styles.subTitle}>Gerado em: {new Date(dataGeracao).toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.subTitle}>Responsável: {criadoPor}</Text>
          </View>
        </View>

        {/* Iteração dos Trechos */}
        {trechos.map((trecho, tIndex) => (
          <View key={tIndex} style={styles.trechoSection} break={tIndex > 0}> 
            {/* 'break' força nova página para cada trecho novo (opcional, mas organizado) */}
            
            <View style={styles.trechoHeader}>
              <Text style={styles.trechoTitle}>{trecho.nome}</Text>
              <Text style={styles.trechoInfo}>
                Km {trecho.kmInicial.toFixed(2)} - {trecho.kmFinal.toFixed(2)} | Vistoria: {new Date(trecho.dataVistoria).toLocaleDateString('pt-BR')}
              </Text>
            </View>

            {trecho.fotos.length === 0 ? (
              <Text style={{fontSize: 10, color: '#777', fontStyle: 'italic', padding: 10}}>Nenhuma foto registrada neste trecho.</Text>
            ) : (
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
                          {foto.patologia?.classificacaoEspecifica || 'Sem classificação'}
                        </Text>
                        <Text style={{fontSize: 7.5, color: '#475569'}}>
                          Cód: {foto.patologia?.codigoDnit || 'N/A'} | IGG: {foto.patologia?.mapeamentoIgg || 'N/A'}
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
            )}
          </View>
        ))}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Relatório Consolidado da Via - Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};