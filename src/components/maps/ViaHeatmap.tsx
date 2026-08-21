'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { HeatmapPoint } from '@/lib/actions/heatmap-data';
import type { Coordenada } from '@/lib/geoUtils';

interface ViaHeatmapProps {
  trajeto: Coordenada[] | null;
  heatmapData: HeatmapPoint[];
  onMapLoad?: (map: any) => void;
}

// Cores baseadas no nível de severidade / FP (DNIT)
function getHeatColor(weight: number, maxWeight: number): string {
  const ratio = Math.min(1, Math.max(0, weight / (maxWeight || 5)));
  if (ratio < 0.2) return '#00ff88'; // Verde (Leve)
  if (ratio < 0.4) return '#aaff00'; // Verde-limão
  if (ratio < 0.6) return '#ffcc00'; // Amarelo (Médio)
  if (ratio < 0.8) return '#ff6600'; // Laranja (Severo)
  return '#ff0033'; // Vermelho vivo (Crítico)
}

export function ViaHeatmap({ trajeto, heatmapData, onMapLoad }: ViaHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentRadius, setCurrentRadius] = useState(25);

  const maxWeight = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 5;
    return Math.max(3, ...heatmapData.map((d) => d.weight));
  }, [heatmapData]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // Destrói instância anterior se existir
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter: [number, number] =
        trajeto && trajeto.length > 0 ? [trajeto[0].lat, trajeto[0].lng] : [-1.4558, -48.5024];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      // Tile Layer Dark elegante (CartoDB Dark Matter / OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Traçado da Via (Polyline)
      if (trajeto && trajeto.length > 0) {
        const latLngs: [number, number][] = trajeto.map((c) => [c.lat, c.lng]);
        const polyline = L.polyline(latLngs, {
          color: '#4f8cff',
          weight: 4,
          opacity: 0.6,
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }

      // Pontos de Calor / Patologias com círculos dinâmicos
      if (heatmapData && heatmapData.length > 0) {
        heatmapData.forEach((point) => {
          const color = getHeatColor(point.weight, maxWeight);
          
          // Halo de calor difuso
          L.circleMarker([point.lat, point.lng], {
            radius: currentRadius,
            fillColor: color,
            fillOpacity: 0.35,
            stroke: false,
          }).addTo(map);

          // Ponto central de impacto
          const centerPoint = L.circleMarker([point.lat, point.lng], {
            radius: Math.max(5, currentRadius * 0.35),
            fillColor: color,
            fillOpacity: 0.9,
            color: '#ffffff',
            weight: 1,
          }).addTo(map);

          centerPoint.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #111;">
              <strong>Ponto de Severidade</strong><br/>
              Peso / FP: <b>${point.weight}</b><br/>
              Lat: ${point.lat.toFixed(5)}, Lng: ${point.lng.toFixed(5)}
            </div>
          `);
        });
      }

      mapInstanceRef.current = map;
      setIsReady(true);
      if (onMapLoad) onMapLoad(map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trajeto, heatmapData, currentRadius, maxWeight, onMapLoad]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border bg-neutral-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}