'use client';

import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  MarkerF,
} from '@react-google-maps/api';
import { Foto } from '@prisma/client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Milestone, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- DEFINIÇÕES GLOBAIS ---
const containerStyle = {
  width: '100%',
  height: '400px',
  borderTopLeftRadius: '0.5rem',
  borderTopRightRadius: '0.5rem',
};

// Adicione 'visualization' aqui para bater com a configuração do Mapa de Calor
const libraries: ('geometry' | 'visualization')[] = ['geometry', 'visualization'];
type Coordenada = { lat: number; lng: number };

interface TrechoDetailMapProps {
  trajeto: Coordenada[] | null;
  kmInicial: number;
  kmFinal: number;
  cor: string;
  fotos: Foto[];
  intervalo?: number;
}

interface PontoEstaca {
  coord: Coordenada;
  numero: number;
  label: string;
}

// --- FUNÇÕES DE GEOMETRIA ---

/**
 * Encontra o traçado (array de Coordenadas) ENTRE dois Kms.
 */
function findPathBetweenKm(
  trajeto: Coordenada[],
  kmStart: number,
  kmEnd: number,
): Coordenada[] {
  if (!window.google?.maps?.geometry || trajeto.length === 0) return [];
  const geometry = window.google.maps.geometry.spherical;
  const metersStart = kmStart * 1000;
  const metersEnd = kmEnd * 1000;
  let accumulatedMeters = 0;
  const trechoPath: Coordenada[] = [];
  let started = false;

  for (let i = 0; i < trajeto.length - 1; i++) {
    const segmentStart = trajeto[i];
    const segmentEnd = trajeto[i + 1];
    const segmentStartLatLng = new google.maps.LatLng(segmentStart);
    const segmentEndLatLng = new google.maps.LatLng(segmentEnd);
    const segmentLength = geometry.computeLength([
      segmentStartLatLng,
      segmentEndLatLng,
    ]);
    const segmentEndMeters = accumulatedMeters + segmentLength;

    if (!started && segmentEndMeters >= metersStart) {
      started = true;
      const distanceIntoSegment = metersStart - accumulatedMeters;
      const fraction = distanceIntoSegment / segmentLength;
      const startPoint = geometry.interpolate(
        segmentStartLatLng,
        segmentEndLatLng,
        Math.max(0, fraction),
      );
      trechoPath.push({ lat: startPoint.lat(), lng: startPoint.lng() });

      if (segmentEndMeters >= metersEnd) {
        const distanceIntoSegmentEnd = metersEnd - accumulatedMeters;
        const fractionEnd = distanceIntoSegmentEnd / segmentLength;
        const endPoint = geometry.interpolate(
          segmentStartLatLng,
          segmentEndLatLng,
          Math.min(1, fractionEnd),
        );
        trechoPath.push({ lat: endPoint.lat(), lng: endPoint.lng() });
        break;
      } else {
        trechoPath.push(segmentEnd);
      }
    } else if (started && segmentEndMeters < metersEnd) {
      trechoPath.push(segmentEnd);
    } else if (started && segmentEndMeters >= metersEnd) {
      const distanceIntoSegment = metersEnd - accumulatedMeters;
      const fraction = distanceIntoSegment / segmentLength;
      const endPoint = geometry.interpolate(
        segmentStartLatLng,
        segmentEndLatLng,
        Math.min(1, fraction),
      );
      trechoPath.push({ lat: endPoint.lat(), lng: endPoint.lng() });
      break;
    }

    accumulatedMeters += segmentLength;
  }

  return trechoPath;
}

/**
 * Gera pontos a cada 20 metros ao longo do path recortado.
 * Calcula o número da estaca baseado no Km Inicial Absoluto.
 */
function gerarPontosEstacasGoogle(
  path: Coordenada[],
  kmInicialAbsoluto: number,
  intervalo: number = 20 // <--- NOVO PARAMETRO
): PontoEstaca[] {
  if (!window.google?.maps?.geometry || path.length < 2) return [];
  
  const geometry = window.google.maps.geometry.spherical;
  const pontos: PontoEstaca[] = [];
  
  const offsetInicial = kmInicialAbsoluto * 1000;
  
  // Define a próxima meta baseada no intervalo escolhido
  let proximaMeta = Math.ceil(offsetInicial / intervalo) * intervalo;
  if (proximaMeta === offsetInicial) proximaMeta += intervalo;

  let distanciaPercorridaNoPath = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = new google.maps.LatLng(path[i]);
    const p2 = new google.maps.LatLng(path[i+1]);
    const distSegmento = geometry.computeLength([p1, p2]);
    const absDistP1 = offsetInicial + distanciaPercorridaNoPath;

    while (proximaMeta <= absDistP1 + distSegmento) {
      const distIntoSegment = proximaMeta - absDistP1;
      const fraction = distIntoSegment / distSegmento;
      const pEstaca = geometry.interpolate(p1, p2, fraction);
      
      // O número da estaca é sempre baseado na regra de 20m, 
      // mesmo que o balão só apareça a cada 100m.
      // Ex: Balão no metro 100 mostra "Estaca 5".
      const numEstacaReal = Math.round(proximaMeta / 20);

      pontos.push({
        coord: { lat: pEstaca.lat(), lng: pEstaca.lng() },
        numero: numEstacaReal,
        label: `${numEstacaReal}`
      });

      proximaMeta += intervalo; // Avança conforme o intervalo visual configurado
    }
    distanciaPercorridaNoPath += distSegmento;
  }

  return pontos;
}

// --- COMPONENTE DO MAPA ---

export function TrechoDetailMap({
  trajeto,
  kmInicial,
  kmFinal,
  cor,
  fotos,
  intervalo = 20, // Padrão 20m se não for passado
}: TrechoDetailMapProps) {
  
  // 1. ESTADO DE VISIBILIDADE (Começa oculto)
  const [showEstacas, setShowEstacas] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const trechoPath = useMemo(() => {
    return trajeto && isLoaded
      ? findPathBetweenKm(trajeto, kmInicial, kmFinal)
      : [];
  }, [trajeto, isLoaded, kmInicial, kmFinal]);

  // 2. GERAÇÃO OTIMIZADA
  // Passamos o 'intervalo' aqui
  const estacasPoints = useMemo(() => {
    return isLoaded && trechoPath.length > 0
      ? gerarPontosEstacasGoogle(trechoPath, kmInicial, intervalo)
      : [];
  }, [isLoaded, trechoPath, kmInicial, intervalo]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (trechoPath.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        trechoPath.forEach((coord: Coordenada) => {
          bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
        });
        map.fitBounds(bounds);
      }
    },
    [trechoPath],
  );

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative group"> {/* Wrapper relativo para posicionar o botão */}
      
      {/* 3. BOTÃO FLUTUANTE DE CONTROLE */}
      <div className="absolute top-2 right-16 z-10">
        <Button
          variant={showEstacas ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowEstacas(!showEstacas)}
          className="shadow-md h-8 text-xs gap-2"
          title={showEstacas ? "Ocultar Estacas" : "Mostrar Estacas"}
        >
          <Milestone className="h-4 w-4" />
          {showEstacas ? "Ocultar Estacas" : "Ver Estacas"}
        </Button>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
        }}
      >
        <Polyline
          path={trechoPath}
          options={{ strokeColor: cor, strokeOpacity: 1.0, strokeWeight: 6 }}
        />

        {/* 4. RENDERIZAÇÃO CONDICIONAL */}
        {showEstacas && estacasPoints.map((estaca) => (
          <MarkerF
            key={`estaca-${estaca.numero}`}
            position={estaca.coord}
            label={{
              text: estaca.label,
              color: 'black',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
            icon={{
              path: 'M -16 -10 L 16 -10 L 16 10 L -16 10 Z',
              fillColor: 'white',
              fillOpacity: 0.9,
              strokeColor: '#333',
              strokeWeight: 1,
              scale: 1,
              labelOrigin: new google.maps.Point(0, 0),
            }}
            zIndex={10}
          />
        ))}

        {fotos.map((foto) => (
          <MarkerF
            key={foto.id}
            position={{ lat: foto.latitude, lng: foto.longitude }}
            zIndex={100}
          />
        ))}
      </GoogleMap>
    </div>
  );
}