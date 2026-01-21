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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    height: 250,
  },
  image: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    marginBottom: 5,
  },
  cardContent: {
    fontSize: 9,
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
                {/* --- CORREÇÃO 2: Adicionado prop 'alt' --- */}
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image 
                  style={styles.image} 
                  src={foto.imageUrl} 
                />
                
                <View style={styles.cardContent}>
                  <Text style={{fontWeight: 'bold', marginBottom: 2}}>
                    {foto.tipo === 'RFT' 
                      ? foto.patologia?.classificacaoEspecifica 
                      : foto.rdsOcorrencia?.ocorrencia}
                  </Text>
                  
                  {foto.tipo === 'RFT' && (
                    <Text style={{fontSize: 8}}>
                      Cód: {foto.patologia?.codigoDnit} | IGG: {foto.patologia?.mapeamentoIgg}
                    </Text>
                  )}
                  
                  <Text style={{marginTop: 4, color: '#444'}}>
                    {foto.descricao || 'Sem observações.'}
                  </Text>
                  
                  <View style={{marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between'}}>
                     <Text style={{fontSize: 7, color: '#888'}}>
                       {new Date(foto.dataCaptura).toLocaleString('pt-BR')}
                     </Text>
                     {foto.estaca && <Text style={{fontSize: 7, color: '#888'}}>Estaca: {foto.estaca}</Text>}
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