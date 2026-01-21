import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subHeader: { fontSize: 12, color: '#666', marginBottom: 20, textAlign: 'center' },
  mapContainer: { border: '1px solid #ddd', padding: 5 },
  mapImage: { width: '100%', height: 500, objectFit: 'contain' },
  legend: { marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  legendItem: { flexDirection: 'row', items: 'center' },
  colorBox: { width: 15, height: 15, marginRight: 5 },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: 'grey' }
});

interface HeatmapPDFProps {
  viaNome: string;
  mapImageBase64: string; // A imagem capturada virá aqui
  dataGeracao: Date;
}

export const HeatmapPDF = ({ viaNome, mapImageBase64, dataGeracao }: HeatmapPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Relatório de Mapa de Calor de Patologias</Text>
      <Text style={styles.subHeader}>Via: {viaNome}</Text>

      <View style={styles.mapContainer}>
        {/* Insere a imagem capturada */}
        <Image src={mapImageBase64} style={styles.mapImage} />
      </View>

      {/* Legenda simples */}
      <View style={styles.legend}>
         <Text style={{fontSize: 10}}>Intensidade (Qtd x Fp): </Text>
         <View style={styles.legendItem}><View style={[styles.colorBox, {backgroundColor: 'rgba(0, 255, 0, 1)'}]}/><Text style={{fontSize: 10}}>Baixa</Text></View>
         <View style={styles.legendItem}><View style={[styles.colorBox, {backgroundColor: 'yellow'}]}/><Text style={{fontSize: 10}}>Média</Text></View>
         <View style={styles.legendItem}><View style={[styles.colorBox, {backgroundColor: 'red'}]}/><Text style={{fontSize: 10}}>Alta</Text></View>
      </View>

      <Text style={styles.footer}>
        Gerado em: {dataGeracao.toLocaleDateString('pt-BR')} | Sistema SGP
      </Text>
    </Page>
  </Document>
);