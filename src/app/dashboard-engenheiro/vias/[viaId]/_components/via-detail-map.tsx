'use client';

import {
  useCallback,
  useRef,
  useState,
  useTransition,
  useMemo,
  useEffect,
} from 'react';
import { Foto, Trecho, Patologia, RdsOcorrencia } from '@prisma/client';
import { toast } from 'sonner';
import { createTrecho } from '@/lib/actions/vias';
import {
  Coordenada,
  findLatLngAtKm,
  findPathBetweenKms,
  calculateStakes,
} from '@/lib/geoUtils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Milestone, AlertTriangle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  PathologyMarkerItem,
  groupPathologies,
  generateBalloonHtml,
  generatePopupHtml,
} from '@/lib/utils/pathologyMapUtils';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderTopLeftRadius: '0.5rem',
  borderTopRightRadius: '0.5rem',
};

const SLIDER_STEP = 0.001;
const PENDING_COLOR = '#ef4444'; // Vermelho

interface ViaDetailMapProps {
  viaId: string;
  trajeto: Coordenada[] | null;
  fotos: (Foto & {
    patologia: Patologia | null;
    rdsOcorrencia: RdsOcorrencia | null;
  })[];
  trechosExistentes: Trecho[];
  viaExtensaoKm: number;
}

export function ViaDetailMap({
  viaId,
  trajeto,
  fotos,
  trechosExistentes,
  viaExtensaoKm,
}: ViaDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const staticLayerGroupRef = useRef<any>(null);
  const sliderLayerGroupRef = useRef<any>(null);
  const initialBoundsFittedRef = useRef<boolean>(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showEstacas, setShowEstacas] = useState(false);
  const [showPatologias, setShowPatologias] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [trechoNome, setTrechoNome] = useState('');
  const [trechoCor, setTrechoCor] = useState('#3b82f6');

  // Filtra as patologias da vistoria mais recente COM RELATÓRIO RFT APROVADO de cada trecho da via
  const patologiasRecentes = useMemo(() => {
    if (!trechosExistentes || trechosExistentes.length === 0) return [];

    const todasPatologiasRecentes: PathologyMarkerItem[] = [];

    trechosExistentes.forEach((trecho: any) => {
      const fotosTrecho = trecho.fotos || [];
      const vistoriasTrecho = trecho.vistorias || [];

      // 1. Considera apenas vistorias que possuem ao menos um relatório RFT APROVADO
      const vistoriasComRftAprovado = vistoriasTrecho.filter((v: any) =>
        v.relatorios && v.relatorios.some((r: any) => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO')
      );

      if (vistoriasComRftAprovado.length === 0) return;

      // 2. Ordena da mais recente para a mais antiga
      const vistoriasOrdenadas = [...vistoriasComRftAprovado].sort(
        (a: any, b: any) => new Date(b.dataVistoria).getTime() - new Date(a.dataVistoria).getTime()
      );

      const latestVistoria = vistoriasOrdenadas[0];

      // 3. IDs das fotos do RFT aprovado
      const rftAprovado = latestVistoria.relatorios?.find(
        (r: any) => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO'
      );
      const approvedPhotoIds = new Set(
        rftAprovado?.fotos ? rftAprovado.fotos.map((rf: any) => rf.fotoId) : []
      );

      const fotosDesteTrecho = fotosTrecho
        .filter((f: any) => {
          if (!f.patologia || !f.patologia.codigoDnit) return false;
          if (f.vistoriaId !== latestVistoria.id) return false;
          if (approvedPhotoIds.size > 0 && !approvedPhotoIds.has(f.id)) return false;
          return true;
        })
        .map((f: any) => ({
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
          trechoNome: trecho.nome,
          patologia: f.patologia,
        }));

      todasPatologiasRecentes.push(...fotosDesteTrecho);
    });

    return todasPatologiasRecentes;
  }, [trechosExistentes]);

  // Agrupamento inteligente para patologias no mesmo ponto / mesma estaca
  const pathologyGroups = useMemo(() => {
    return groupPathologies(patologiasRecentes, 10);
  }, [patologiasRecentes]);

  // Calcula o Km inicial do próximo trecho
  const proximoKmInicial = useMemo(() => {
    return trechosExistentes.length > 0
      ? trechosExistentes[trechosExistentes.length - 1].kmFinal
      : 0;
  }, [trechosExistentes]);

  const [sliderValue, setSliderValue] = useState(proximoKmInicial);

  useEffect(() => {
    setSliderValue(proximoKmInicial);
  }, [proximoKmInicial]);

  const movableMarkerPosition = useMemo(() => {
    if (!trajeto) return null;
    return findLatLngAtKm(trajeto, sliderValue);
  }, [trajeto, sliderValue]);

  // Estacas reais de 20 em 20 metros (Padrão Oficial DNIT)
  const estacasPoints = useMemo(() => {
    if (!trajeto || trajeto.length < 2) return [];
    return calculateStakes(trajeto, 20);
  }, [trajeto]);

  const remainingDistance = viaExtensaoKm - proximoKmInicial;
  const isCompleto = remainingDistance < SLIDER_STEP;

  // 1. Inicializar Leaflet Map (Executa apenas uma vez ao montar o container)
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
        trajeto && trajeto.length > 0 ? [trajeto[0].lat, trajeto[0].lng] : [-1.4558, -48.5024];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      staticLayerGroupRef.current = L.layerGroup().addTo(map);
      sliderLayerGroupRef.current = L.layerGroup().addTo(map);
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
  }, [viaId, trajeto]);

  // 2. Renderizar camadas ESTÁTICAS (Polylines de trechos, pendente, estacas e fotos)
  useEffect(() => {
    if (!mapInstanceRef.current || !staticLayerGroupRef.current || !isMapReady) return;

    async function updateStaticLayers() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      const lg = staticLayerGroupRef.current;
      lg.clearLayers();

      if (!trajeto || trajeto.length === 0) return;

      // a) Traçado PENDENTE (Vermelho tracejado)
      if (!isCompleto) {
        const pendingPath = findPathBetweenKms(trajeto, proximoKmInicial, viaExtensaoKm);
        if (pendingPath.length > 0) {
          const latLngs: [number, number][] = pendingPath.map((p) => [p.lat, p.lng]);
          L.polyline(latLngs, {
            color: PENDING_COLOR,
            weight: 6,
            opacity: 0.85,
            dashArray: '8, 8',
          }).addTo(lg);
        }
      }

      // b) Traçados CONCLUÍDOS (Coloridos por trecho)
      trechosExistentes.forEach((trecho) => {
        const trechoPath = findPathBetweenKms(trajeto, trecho.kmInicial, trecho.kmFinal);
        if (trechoPath.length > 0) {
          const latLngs: [number, number][] = trechoPath.map((p) => [p.lat, p.lng]);
          const poly = L.polyline(latLngs, {
            color: trecho.cor || '#3b82f6',
            weight: 6,
            opacity: 0.95,
          }).addTo(lg);

          poly.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #111;">
              <strong>${trecho.nome}</strong><br/>
              Km ${trecho.kmInicial.toFixed(2)} ao Km ${trecho.kmFinal.toFixed(2)}
            </div>
          `);
        }
      });

      // c) Ajustar Bounds APENAS na primeira vez que o mapa é carregado
      if (!initialBoundsFittedRef.current) {
        const fullLatLngs: [number, number][] = trajeto.map((p) => [p.lat, p.lng]);
        if (fullLatLngs.length > 1) {
          const bounds = L.latLngBounds(fullLatLngs);
          map.fitBounds(bounds, { padding: [40, 40] });
          initialBoundsFittedRef.current = true;
        }
      }

      // d) Estacas da Via (20 em 20 metros oficiais com auto-ajuste de largura)
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
            `Estaca ${estaca.label} (Distância: ${(estaca.numero * 20).toFixed(0)}m)`,
            { direction: 'top', offset: [0, -10] }
          );
        });
      }

      // e) Balões das Patologias da Vistoria Mais Recente de cada Trecho
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

    updateStaticLayers();
  }, [
    isMapReady,
    trajeto,
    trechosExistentes,
    proximoKmInicial,
    viaExtensaoKm,
    isCompleto,
    showEstacas,
    estacasPoints,
    showPatologias,
    pathologyGroups,
  ]);

  // 3. Renderizar o MARCADOR DO SLIDER dinamicamente
  useEffect(() => {
    if (!mapInstanceRef.current || !sliderLayerGroupRef.current || !isMapReady) return;

    async function updateSliderMarker() {
      const L = (await import('leaflet')).default;
      const sliderLg = sliderLayerGroupRef.current;
      sliderLg.clearLayers();

      if (movableMarkerPosition && !isCompleto) {
        const sliderIcon = L.divIcon({
          className: 'custom-slider-pin',
          html: `<div style="background:#ef4444; color:white; font-size:11px; font-weight:bold; padding:3px 7px; border-radius:6px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); white-space:nowrap;">Km ${sliderValue.toFixed(3)}</div>`,
          iconSize: [60, 24],
          iconAnchor: [30, 24],
        });
        L.marker([movableMarkerPosition.lat, movableMarkerPosition.lng], {
          icon: sliderIcon,
          zIndexOffset: 1000,
        }).addTo(sliderLg);
      }
    }

    updateSliderMarker();
  }, [isMapReady, movableMarkerPosition, isCompleto, sliderValue]);

  const handleOpenModal = () => {
    if (sliderValue <= proximoKmInicial) {
      toast.error('Arraste o slider para definir um Km Final maior que o inicial.');
      return;
    }
    setTrechoNome(`Trecho ${trechosExistentes.length + 1}`);
    setModalOpen(true);
  };

  const handleSaveTrecho = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append('viaId', viaId);
      formData.append('nome', trechoNome);
      formData.append('kmInicial', proximoKmInicial.toString());
      formData.append('kmFinal', sliderValue.toString());
      formData.append('cor', trechoCor);

      const result = await createTrecho(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setModalOpen(false);
      }
    });
  };

  return (
    <div>
      {/* Botão de alternância de Estacas */}
      <div className="relative">
        <div ref={mapContainerRef} style={containerStyle} />

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

      {/* Controle do Slider */}
      <div className="p-4 bg-muted/40 border-t space-y-4">
        {isCompleto ? (
          <div className="text-center py-2 text-green-700 dark:text-green-400 font-semibold text-sm">
            ✅ A via está 100% dividida em trechos.
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">
                Novo Trecho: Km {proximoKmInicial.toFixed(3)} até Km {sliderValue.toFixed(3)}
              </span>
              <span className="text-muted-foreground text-xs">
                Extensão: {(sliderValue - proximoKmInicial).toFixed(3)} km
              </span>
            </div>

            <Slider
              min={proximoKmInicial}
              max={viaExtensaoKm}
              step={SLIDER_STEP}
              value={[sliderValue]}
              onValueChange={(val) => setSliderValue(val[0])}
              className="py-1"
            />

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-muted-foreground">
                Início: {proximoKmInicial.toFixed(3)} km
              </span>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenModal}
                disabled={sliderValue <= proximoKmInicial}
                className="gap-2"
              >
                Salvar Trecho
              </Button>

              <span className="text-xs text-muted-foreground">
                Fim da Via: {viaExtensaoKm.toFixed(3)} km
              </span>
            </div>
          </>
        )}
      </div>

      {/* Modal para Definir Nome e Cor do Novo Trecho */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveTrecho}>
            <DialogHeader>
              <DialogTitle>Criar Novo Trecho</DialogTitle>
              <DialogDescription>
                Defina o nome e a cor de identificação deste trecho no mapa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Trecho</Label>
                <Input
                  id="nome"
                  required
                  value={trechoNome}
                  onChange={(e) => setTrechoNome(e.target.value)}
                  placeholder="Ex: Trecho 01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Km Inicial</Label>
                  <Input value={`Km ${proximoKmInicial.toFixed(3)}`} disabled />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Km Final</Label>
                  <Input value={`Km ${sliderValue.toFixed(3)}`} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor no Mapa</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="cor"
                    value={trechoCor}
                    onChange={(e) => setTrechoCor(e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer border p-0.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    Esta cor será usada na polilinha do trecho
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !trechoNome}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar e Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}