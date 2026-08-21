'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Foto } from '@prisma/client';
import { Milestone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Coordenada,
  findPathBetweenKms,
  calculateStakes,
} from '@/lib/geoUtils';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderTopLeftRadius: '0.5rem',
  borderTopRightRadius: '0.5rem',
};

interface TrechoDetailMapProps {
  trajeto: Coordenada[] | null;
  kmInicial: number;
  kmFinal: number;
  cor: string;
  fotos: Foto[];
  intervalo?: number;
}

export function TrechoDetailMap({
  trajeto,
  kmInicial,
  kmFinal,
  cor,
  fotos,
}: TrechoDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const initialBoundsFittedRef = useRef<boolean>(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showEstacas, setShowEstacas] = useState(false);

  const trechoPath = useMemo(() => {
    return trajeto ? findPathBetweenKms(trajeto, kmInicial, kmFinal) : [];
  }, [trajeto, kmInicial, kmFinal]);

  // Estaqueamento absoluto da via (ex: início a 88m começa em E4+8m)
  const estacasPoints = useMemo(() => {
    if (!trechoPath || trechoPath.length < 2) return [];
    const startOffsetMeters = kmInicial * 1000;
    return calculateStakes(trechoPath, 20, startOffsetMeters);
  }, [trechoPath, kmInicial]);

  // Inicializar o mapa
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const defaultCenter: [number, number] =
        trechoPath && trechoPath.length > 0
          ? [trechoPath[0].lat, trechoPath[0].lng]
          : [-1.4558, -48.5024];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      initialBoundsFittedRef.current = false;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
  }, [kmInicial, kmFinal, trechoPath]);

  // Atualizar camadas (Polyline do trecho, estacas e fotos)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !isMapReady) return;

    async function updateLayers() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const lg = layerGroupRef.current;
      lg.clearLayers();

      if (trechoPath.length === 0) return;

      // 1. Polyline do trecho com a cor configurada
      const latLngs: [number, number][] = trechoPath.map((p) => [p.lat, p.lng]);
      const polyline = L.polyline(latLngs, {
        color: cor || '#2563eb',
        weight: 6,
        opacity: 0.95,
      }).addTo(lg);

      // Ajusta o zoom apenas na primeira renderização
      if (!initialBoundsFittedRef.current) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        initialBoundsFittedRef.current = true;
      }

      // 2. Estacas absolutas de 20m com auto-ajuste de largura
      if (showEstacas) {
        estacasPoints.forEach((estaca) => {
          const estacaIcon = L.divIcon({
            className: 'custom-stake-wrapper',
            html: `<div style="background:white; color:#0f172a; font-size:9px; font-weight:700; padding:2px 5px; border-radius:4px; border:1px solid #334155; box-shadow:0 1px 4px rgba(0,0,0,0.35); text-align:center; white-space:nowrap; display:inline-block; transform:translate(-50%, -50%);">${estaca.label}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          const marker = L.marker([estaca.coord.lat, estaca.coord.lng], { icon: estacaIcon }).addTo(lg);
          marker.bindTooltip(
            `Estaca ${estaca.label} (Distância na Via: ${(estaca.numero * 20).toFixed(0)}m)`,
            { direction: 'top', offset: [0, -10] }
          );
        });
      }

      // 3. Pins das Fotos
      fotos.forEach((foto) => {
        const fotoIcon = L.divIcon({
          className: 'custom-photo-pin',
          html: `<div style="background:#ef4444; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = L.marker([foto.latitude, foto.longitude], { icon: fotoIcon }).addTo(lg);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #111;">
            <strong>Foto ${foto.tipo}</strong><br/>
            ${foto.estaca ? `Estaca: ${foto.estaca}<br/>` : ''}
            <small>${new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}</small>
          </div>
        `);
      });
    }

    updateLayers();
  }, [isMapReady, trechoPath, cor, showEstacas, estacasPoints, fotos]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} style={containerStyle} />

      {/* Botão de alternância de Estacas no canto superior direito */}
      <div className="absolute top-3 right-3 z-[400]">
        <Button
          type="button"
          size="sm"
          onClick={() => setShowEstacas(!showEstacas)}
          className={`shadow-md text-xs gap-1.5 transition-all ${
            showEstacas
              ? 'bg-teal-700 text-white hover:bg-teal-800'
              : 'bg-white/95 text-slate-800 hover:bg-white border border-slate-300 dark:bg-slate-900 dark:text-slate-100'
          }`}
        >
          <Milestone className="h-3.5 w-3.5" />
          {showEstacas ? 'Ocultar Estacas' : 'Ver Estacas'}
        </Button>
      </div>
    </div>
  );
}