'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import type { Coordenada } from './create-via-form';

interface CreateViaMapProps {
  onMapChange: (path: Coordenada[], lengthInKm: number) => void;
}

export function CreateViaMap({ onMapChange }: CreateViaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const [origin, setOrigin] = useState<Coordenada | null>(null);
  const [destination, setDestination] = useState<Coordenada | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Inicialização do Mapa Leaflet
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      const map = L.map(mapContainerRef.current, {
        center: [-1.4558, -48.5024], // Belém, PA
        zoom: 13,
        zoomControl: true,
      });

      // Tile Layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Calcula rota usando o serviço público e gratuito do Open Source Routing Machine (OSRM)
  const calculateRouteOSRM = useCallback(
    async (start: Coordenada, end: Coordenada) => {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const lengthInKm = route.distance / 1000;
          const coordinatesGeoJson: [number, number][] = route.geometry.coordinates;

          const path: Coordenada[] = coordinatesGeoJson.map(([lng, lat]) => ({
            lat,
            lng,
          }));

          onMapChange(path, parseFloat(lengthInKm.toFixed(3)));
          toast.success(`Rota calculada: ${lengthInKm.toFixed(2)} km!`);

          // Renderizar traçado no mapa
          if (mapInstanceRef.current && layerGroupRef.current) {
            const L = (await import('leaflet')).default;
            const lg = layerGroupRef.current;
            lg.clearLayers();

            // Marcador A (Início)
            const iconA = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background:#10b981; color:white; font-weight:bold; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">A</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([start.lat, start.lng], { icon: iconA }).addTo(lg);

            // Marcador B (Fim)
            const iconB = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background:#ef4444; color:white; font-weight:bold; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">B</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([end.lat, end.lng], { icon: iconB }).addTo(lg);

            // Polyline da Rota
            const latLngs: [number, number][] = path.map((p) => [p.lat, p.lng]);
            const polyline = L.polyline(latLngs, {
              color: '#2563eb',
              weight: 5,
              opacity: 0.85,
            }).addTo(lg);

            mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          }
        } else {
          throw new Error('Rota não encontrada pelo OSRM');
        }
      } catch (error) {
        console.error('Erro ao calcular rota OSRM:', error);
        toast.error('Não foi possível traçar rota automática. Traçando linha reta entre os pontos.');
        
        // Fallback linha reta
        const path = [start, end];
        const distKm = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)) * 111;
        onMapChange(path, parseFloat(distKm.toFixed(3)));
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [onMapChange]
  );

  // Manipulador de clique no mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    const map = mapInstanceRef.current;

    async function handleClick(e: any) {
      if (destination) return; // Rota já concluída
      const L = (await import('leaflet')).default;
      const clickedCoord: Coordenada = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (!origin) {
        setOrigin(clickedCoord);
        toast.info('Ponto inicial (A) definido. Clique no mapa para definir o ponto final (B).');

        if (layerGroupRef.current) {
          const iconA = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#10b981; color:white; font-weight:bold; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">A</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker([clickedCoord.lat, clickedCoord.lng], { icon: iconA }).addTo(layerGroupRef.current);
        }
      } else if (!destination) {
        setDestination(clickedCoord);
        toast.info('Ponto final (B) definido. Calculando rota via OpenStreetMap...');
        calculateRouteOSRM(origin, clickedCoord);
      }
    }

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isMapReady, origin, destination, calculateRouteOSRM]);

  // Limpa o mapa
  const handleClear = () => {
    setOrigin(null);
    setDestination(null);
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }
    onMapChange([], 0);
    toast.info('Mapa limpo. Clique para selecionar um novo ponto inicial.');
  };

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={handleClear}
        className="absolute top-3 right-3 z-[1000] shadow-md"
      >
        <X className="mr-1 h-4 w-4" />
        Limpar Rota
      </Button>

      {isLoadingRoute && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-[1001]">
          <div className="bg-background px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Calculando traçado da via...</span>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}