'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { Milestone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Coordenada,
  findPathBetweenKms,
  calculateStakes,
} from '@/lib/geoUtils';
import {
  PathologyMarkerItem,
  groupPathologies,
  generateBalloonHtml,
  generatePopupHtml,
} from '@/lib/utils/pathologyMapUtils';

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
  fotos: (Foto & {
    patologia?: Patologia | null;
    rdsOcorrencia?: RdsOcorrencia | null;
  })[];
  vistorias?: Array<{
    id: string;
    dataVistoria: Date | string;
    motivo?: string;
    relatorios?: Array<{
      id: string;
      tipo: string;
      statusAprovacao: string;
      fotos?: Array<{ fotoId: string }>;
    }>;
  }>;
  intervalo?: number;
}

export function TrechoDetailMap({
  trajeto,
  kmInicial,
  kmFinal,
  cor,
  fotos,
  vistorias = [],
}: TrechoDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const initialBoundsFittedRef = useRef<boolean>(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showEstacas, setShowEstacas] = useState(false);
  const [showPatologias, setShowPatologias] = useState(false);

  const trechoPath = useMemo(() => {
    return trajeto ? findPathBetweenKms(trajeto, kmInicial, kmFinal) : [];
  }, [trajeto, kmInicial, kmFinal]);

  // Estaqueamento absoluto da via (ex: início a 88m começa em E4+8m)
  const estacasPoints = useMemo(() => {
    if (!trechoPath || trechoPath.length < 2) return [];
    const startOffsetMeters = kmInicial * 1000;
    return calculateStakes(trechoPath, 20, startOffsetMeters);
  }, [trechoPath, kmInicial]);

  // Filtra as patologias pertencentes estritamente à Vistoria mais recente COM RFT APROVADO
  const patologiasRecentes = useMemo(() => {
    if (!fotos || fotos.length === 0 || !vistorias || vistorias.length === 0) return [];

    // 1. Considera apenas vistorias que possuem ao menos um relatório RFT APROVADO
    const vistoriasComRftAprovado = vistorias.filter((v: any) =>
      v.relatorios && v.relatorios.some((r: any) => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO')
    );

    if (vistoriasComRftAprovado.length === 0) return [];

    // 2. Ordena as vistorias aprovadas da mais recente para a mais antiga
    const vistoriasOrdenadas = [...vistoriasComRftAprovado].sort(
      (a: any, b: any) => new Date(b.dataVistoria).getTime() - new Date(a.dataVistoria).getTime()
    );

    const latestVistoria = vistoriasOrdenadas[0];

    // 3. Obtém os IDs das fotos incluídas no RFT aprovado desta vistoria
    const rftAprovado = latestVistoria.relatorios?.find(
      (r: any) => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO'
    );
    const approvedPhotoIds = new Set(
      rftAprovado?.fotos ? rftAprovado.fotos.map((rf: any) => rf.fotoId) : []
    );

    return fotos
      .filter((f) => {
        if (!f.patologia || !f.patologia.codigoDnit) return false;
        if (f.vistoriaId !== latestVistoria.id) return false;
        if (approvedPhotoIds.size > 0 && !approvedPhotoIds.has(f.id)) return false;
        return true;
      })
      .map((f) => ({
        id: f.id,
        latitude: f.latitude,
        longitude: f.longitude,
        estaca: f.estaca,
        imageUrl: f.imageUrl,
        tipo: f.tipo,
        grauSeveridade: f.grauSeveridade,
        extensaoM: f.extensaoM,
        larguraM: f.larguraM,
        dataCaptura: f.dataCaptura,
        vistoriaId: f.vistoriaId,
        vistoriaData: latestVistoria.dataVistoria || f.dataCaptura,
        patologia: f.patologia!,
      })) as PathologyMarkerItem[];
  }, [fotos, vistorias]);

  // Agrupamento inteligente para patologias no mesmo ponto / mesma estaca
  const pathologyGroups = useMemo(() => {
    return groupPathologies(patologiasRecentes, 8);
  }, [patologiasRecentes]);

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

  // Atualizar camadas (Polyline do trecho, estacas e balões de patologias)
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

      // 3. Balões das Patologias da Vistoria Mais Recente
      if (showPatologias) {
        pathologyGroups.forEach((group) => {
          const balloonIcon = L.divIcon({
            className: 'custom-pathology-balloon-wrapper',
            html: generateBalloonHtml(group),
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const marker = L.marker([group.lat, group.lng], { icon: balloonIcon }).addTo(lg);
          marker.bindPopup(generatePopupHtml(group), {
            maxWidth: 300,
            minWidth: 230,
            className: 'custom-pathology-popup',
          });
        });
      }
    }

    updateLayers();
  }, [
    isMapReady,
    trechoPath,
    cor,
    showEstacas,
    estacasPoints,
    showPatologias,
    pathologyGroups,
  ]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} style={containerStyle} />

      {/* Botões de controle no canto superior direito */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {/* Alternância de Estacas */}
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

        {/* Alternância de Balões de Patologias */}
        <Button
          type="button"
          size="sm"
          onClick={() => setShowPatologias(!showPatologias)}
          className={`shadow-md text-xs gap-1.5 transition-all ${
            showPatologias
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20'
              : 'bg-white/95 text-slate-800 hover:bg-white border border-slate-300 dark:bg-slate-900 dark:text-slate-100'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {showPatologias ? 'Ocultar Patologias' : 'Ver Patologias'}
          {patologiasRecentes.length > 0 && (
            <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              showPatologias ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {patologiasRecentes.length}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}