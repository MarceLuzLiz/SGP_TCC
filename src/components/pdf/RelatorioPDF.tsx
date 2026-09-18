import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';

// Tipos de dados
type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface RelatorioPDFProps {
  titulo: string;
  tipo: string;
  trechoNome: string;
  viaNome: string;
  dataVistoria: Date;
  criadoPor: string;
  aprovadoPor: string | null;
  fotos: FotoCompleta[];
  logoUrl: string;
}

// Estilos (CSS-in-JS para PDF)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: 'center',
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
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
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
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#666',
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

// --- CORREÇÃO 1: Usando Generics <T> em vez de any[] ---
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

export const RelatorioPDF = ({
  titulo,
  tipo,
  trechoNome,
  viaNome,
  dataVistoria,
  criadoPor,
  aprovadoPor,
  fotos,
  logoUrl
}: RelatorioPDFProps) => {
  
  const photoChunks = chunkArray(fotos, 4);

  return (
    <Document>
      {photoChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* CABEÇALHO */}
          <View style={styles.header}>
            {/* --- CORREÇÃO 2: Adicionado prop 'alt' --- */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoUrl && <Image style={styles.logo} src={logoUrl} />}
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{titulo}</Text>
              <Text style={styles.subTitle}>Via: {viaNome} | Trecho: {trechoNome}</Text>
              <Text style={styles.subTitle}>
                Tipo: {tipo} | Data Vistoria: {new Date(dataVistoria).toLocaleDateString('pt-BR')}
              </Text>
              <Text style={styles.subTitle}>
                Fiscal: {criadoPor} | Aprovado por: {aprovadoPor || 'N/A'}
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
                      {foto.tipo === 'RFT' 
                        ? foto.patologia?.classificacaoEspecifica 
                        : foto.rdsOcorrencia?.ocorrencia}
                    </Text>
                    
                    {foto.tipo === 'RFT' && (
                      <Text style={{fontSize: 7.5, color: '#475569'}}>
                        Cód: {foto.patologia?.codigoDnit} | IGG: {foto.patologia?.mapeamentoIgg}
                      </Text>
                    )}
                    
                    <Text style={{marginTop: 3, color: '#334155', fontSize: 7.5, lineHeight: 1.2}}>
                      {foto.descricao || 'Sem observações.'}
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

          {/* Rodapé */}
          <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
            `Sistema de Gerenciamento de Pavimentos (SGP) - Página ${pageNumber + pageIndex} de ${totalPages}`
          )} />
        </Page>
      ))}
    </Document>
  );
};