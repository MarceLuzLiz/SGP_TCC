'use client';

import { GoogleMap, useJsApiLoader, HeatmapLayerF, Polyline } from '@react-google-maps/api';
import { useMemo, useRef, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HeatmapPoint } from '@/lib/actions/heatmap-data';

// GRADIENTE AJUSTADO (Verde -> Amarelo -> Vermelho)
const heatmapGradient = [
  'rgba(0, 255, 0, 0)',    // 0: Invisível/Verde Transparente
  'rgba(0, 255, 0, 1)',    // Verde
  'rgba(191, 255, 0, 1)',  // Verde-Limão
  'rgba(255, 255, 0, 1)',  // Amarelo
  'rgba(255, 127, 0, 1)',  // Laranja
  'rgba(255, 0, 0, 1)',    // Vermelho
  'rgba(150, 0, 0, 1)'     // Vinho (Crítico)
];

interface Coordenada { lat: number; lng: number; }

interface ViaHeatmapProps {
  trajeto: Coordenada[] | null;
  heatmapData: HeatmapPoint[];
  onMapLoad?: (map: google.maps.Map) => void;
}

export function ViaHeatmap({ trajeto, heatmapData, onMapLoad }: ViaHeatmapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geometry', 'visualization'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Estado para o raio dinâmico
  const [currentRadius, setCurrentRadius] = useState(20);

  // 1. CALCULAR A INTENSIDADE MÁXIMA DINÂMICA
  // Varre os dados para encontrar o maior peso (FP) presente nesta via.
  const maxIntensityCalculada = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 10; // Padrão se vazio

    // Encontra o maior peso entre todos os pontos
    const maxWeight = Math.max(...heatmapData.map(d => d.weight));

    // Se o maior peso for muito baixo (ex: 2), forçamos um mínimo de 3 para não distorcer a escala.
    // Se for alto (ex: 50), usamos 50.
    return Math.max(3, maxWeight);
  }, [heatmapData]);

  const processedHeatmapData = useMemo(() => {
    if (!isLoaded || !heatmapData) return [];
    return heatmapData.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));
  }, [isLoaded, heatmapData]);

  // Função de ajuste de zoom (Raio)
  const handleZoomChanged = () => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getZoom() || 14;
    // Fórmula ajustada para garantir visibilidade
    const newRadius = Math.max(10, (zoom - 9) * 2);
    setCurrentRadius(newRadius);
  };

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (trajeto && trajeto.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        trajeto.forEach(coord => bounds.extend(new google.maps.LatLng(coord.lat, coord.lng)));
        map.fitBounds(bounds);
    }
    
    // Configura raio inicial
    const initialZoom = map.getZoom() || 14;
    setCurrentRadius(Math.max(10, (initialZoom - 5) * 3));

    if (onMapLoad) onMapLoad(map);
  }, [trajeto, onMapLoad]);

  if (!isLoaded) return <div className="h-[600px] flex items-center justify-center bg-muted"><Loader2 className="animate-spin" /></div>;

  return (
    <GoogleMap
        mapContainerStyle={{ width: '100%', height: '600px', borderRadius: '8px' }}
        onLoad={handleMapLoad}
        onZoomChanged={handleZoomChanged}
        options={{
            mapTypeControl: false,
            streetViewControl: false,
            // Estilo Dark para realçar as cores
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] }, 
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, 
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }, 
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }, 
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] }, 
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] }, 
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
            ]
        }}
    >
      {trajeto && <Polyline path={trajeto} options={{ strokeColor: '#555', strokeWeight: 4, strokeOpacity: 0.5 }} />}
      
      <HeatmapLayerF
        data={processedHeatmapData}
        options={{
            gradient: heatmapGradient,
            radius: currentRadius,
            opacity: 0.9, // Aumentei um pouco a opacidade para ficar mais vivo
            
            // --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
            // Agora o 'vermelho' é atingido quando o peso chega no máximo encontrado na via.
            maxIntensity: maxIntensityCalculada 
        }}
      />
    </GoogleMap>
  );
}