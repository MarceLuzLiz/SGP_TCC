import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';

// Tipos de dados
type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

interface RelatorioRDSPDFProps {
  titulo: string;
  tipo: string;
  trechoNome: string;
  viaNome: string;
  dataVistoria: Date;
  criadoPor: string;
  aprovadoPor: string | null;
  fotos: FotoCompleta[];
  dadosRDS: DadosRDS; // <-- Novos dados
  logoUrl: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  headerInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
  },
  // Estilo específico para os dados do RDS no cabeçalho
  rdsInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
    justifyContent: 'space-between',
  },
  rdsInfoItem: {
    fontSize: 9,
    color: '#333',
  },
  rdsTextLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    minHeight: 230,
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
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  cardContent: {
    fontSize: 9,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: 'grey',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
});

// Helper para dividir o array (Genérico)
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

export const RelatorioRDSPDF = ({
  titulo,
  trechoNome,
  viaNome,
  dataVistoria,
  criadoPor,
  aprovadoPor,
  fotos,
  dadosRDS,
  logoUrl
}: RelatorioRDSPDFProps) => {
  
  const photoChunks = chunkArray(fotos, 4);

  return (
    <Document>
      {photoChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          
          {/* CABEÇALHO EXPANDIDO */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {logoUrl && <Image style={styles.logo} src={logoUrl} />}
              <View style={styles.headerInfo}>
                <Text style={styles.title}>{titulo}</Text>
                <Text style={styles.subTitle}>Via: {viaNome} | Trecho: {trechoNome}</Text>
                <Text style={styles.subTitle}>
                  Data: {new Date(dataVistoria).toLocaleDateString('pt-BR')} | Fiscal: {criadoPor}
                </Text>
                <Text style={styles.subTitle}>Aprovado por: {aprovadoPor || 'N/A'}</Text>
              </View>
            </View>

            {/* DADOS ESPECÍFICOS DO RDS */}
            <View style={styles.rdsInfoBox}>
              <Text style={styles.rdsInfoItem}>
                <Text style={styles.rdsTextLabel}>Clima:</Text> {dadosRDS.clima || 'N/A'}
              </Text>
              <Text style={styles.rdsInfoItem}>
                <Text style={styles.rdsTextLabel}>Entrada:</Text> {dadosRDS.horarioEntrada || 'N/A'}
              </Text>
              <Text style={styles.rdsInfoItem}>
                <Text style={styles.rdsTextLabel}>Saída:</Text> {dadosRDS.horarioSaida || 'N/A'}
              </Text>
            </View>
          </View>

          {/* GRID 2x2 */}
          <View style={styles.grid}>
            {chunk.map((foto: FotoCompleta) => (
              <View key={foto.id} style={styles.card}>
                <View style={styles.imageWrapper}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image 
                    style={styles.image} 
                    src={foto.imageUrl} 
                  />
                </View>
                <View style={styles.cardContent}>
                  <View>
                    <Text style={{fontWeight: 'bold', fontSize: 9, marginBottom: 2, color: '#0f172a'}}>
                      {foto.rdsOcorrencia?.ocorrencia || 'Ocorrência Geral'}
                    </Text>
                    <Text style={{fontSize: 7.5, color: '#475569'}}>
                      Categoria: {foto.rdsOcorrencia?.categoria || 'N/A'}
                    </Text>
                    <Text style={{marginTop: 3, color: '#334155', fontSize: 7.5, lineHeight: 1.2}}>
                      {foto.descricao ? (foto.descricao.length > 80 ? foto.descricao.substring(0, 80) + '...' : foto.descricao) : 'Sem observações.'}
                    </Text>
                  </View>
                  <View style={{marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                     <Text style={{fontSize: 7, color: '#64748b'}}>
                       {new Date(foto.dataCaptura).toLocaleString('pt-BR')}
                     </Text>
                     {foto.estaca && (
                       <Text style={{fontSize: 7, fontWeight: 'bold', color: '#0f766e'}}>
                         Estaca: {foto.estaca}
                       </Text>
                     )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
            `Relatório Diário de Serviço (RDS) - Página ${pageNumber + pageIndex} de ${totalPages}`
          )} />
        </Page>
      ))}
    </Document>
  );
};