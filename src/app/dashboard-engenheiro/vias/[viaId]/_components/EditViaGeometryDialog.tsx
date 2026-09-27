'use client';

import { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Loader2, Ruler } from 'lucide-react';
import { updateViaGeometry } from '@/lib/actions/vias';
import {
  Coordenada,
  findLatLngAtKm,
  findPathBetweenKms,
} from '@/lib/geoUtils';

interface TrechoBasic {
  id: string;
  nome: string;
  kmInicial: number;
  kmFinal: number;
  cor: string;
}

interface EditViaGeometryDialogProps {
  via: {
    id: string;
    name: string;
    extensaoKm: number;
  };
  trajeto: Coordenada[] | null;
  trechos: TrechoBasic[];
}

const SLIDER_STEP = 0.001;

/**
 * Componente interno do mapa da Via, montado somente quando o Dialog está aberto.
 */
function ViaEditMap({
  trajeto,
  sliderValue,
  viaExtensaoKm,
  trechos,
}: {
  trajeto: Coordenada[];
  sliderValue: number;
  viaExtensaoKm: number;
  trechos: TrechoBasic[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const dynamicLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // 1. Inicialização do Mapa Leaflet
  useEffect(() => {
    let isMounted = true;
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    async function init() {
      if (!containerRef.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if ((containerRef.current as any)._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id;
      }

      const center: [number, number] = [trajeto[0].lat, trajeto[0].lng];
      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Camada estática: trajeto original completo (cinza) + trechos
      const staticLg = L.layerGroup().addTo(map);

      // Trajeto original completo como contexto visual
      const fullLatLngs: [number, number][] = trajeto.map((p) => [p.lat, p.lng]);
      L.polyline(fullLatLngs, {
        color: '#94a3b8',
        weight: 4,
        opacity: 0.35,
        dashArray: '6, 6',
      }).addTo(staticLg);

      // Trechos existentes da via
      trechos.forEach((t) => {
        const path = findPathBetweenKms(trajeto, t.kmInicial, t.kmFinal);
        if (path.length > 0) {
          const latLngs: [number, number][] = path.map((p) => [p.lat, p.lng]);
          const poly = L.polyline(latLngs, {
            color: t.cor || '#3b82f6',
            weight: 5,
            opacity: 0.7,
          }).addTo(staticLg);
          poly.bindTooltip(t.nome, { sticky: true });
        }
      });

      // Camada dinâmica
      const dynLg = L.layerGroup().addTo(map);
      dynamicLayerRef.current = dynLg;

      // Bounds
      if (fullLatLngs.length > 1) {
        try {
          map.fitBounds(L.latLngBounds(fullLatLngs), { padding: [35, 35] });
        } catch {
          // ignore
        }
      }

      mapRef.current = map;
      setMapReady(true);

      timer1 = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 150);

      timer2 = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 400);
    }

    const startTimer = setTimeout(() => {
      init();
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(startTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [trajeto, trechos]);

  // 2. Atualização dinâmica da polilinha verde e corte vermelho
  useEffect(() => {
    if (!mapRef.current || !dynamicLayerRef.current || !mapReady) return;

    let isMounted = true;
    async function updateDynamic() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !dynamicLayerRef.current) return;

      const lg = dynamicLayerRef.current;
      lg.clearLayers();

      // Polilinha da via mantida (verde)
      const viaPath = findPathBetweenKms(trajeto, 0, sliderValue);
      if (viaPath.length > 0) {
        const latLngs: [number, number][] = viaPath.map((p) => [p.lat, p.lng]);
        L.polyline(latLngs, {
          color: '#16a34a',
          weight: 6,
          opacity: 0.85,
        }).addTo(lg);
      }

      // Trecho que será cortado (vermelho tracejado)
      if (sliderValue < viaExtensaoKm - 0.001) {
        const cutPath = findPathBetweenKms(trajeto, sliderValue, viaExtensaoKm);
        if (cutPath.length > 0) {
          const cutLatLngs: [number, number][] = cutPath.map((p) => [p.lat, p.lng]);
          L.polyline(cutLatLngs, {
            color: '#dc2626',
            weight: 5,
            opacity: 0.7,
            dashArray: '8, 8',
          }).addTo(lg);
        }
      }

      // Marcador no ponto final
      const endPos = findLatLngAtKm(trajeto, sliderValue);
      if (endPos) {
        const icon = L.divIcon({
          className: 'custom-clean-marker',
          html: `<div style="display:inline-flex; align-items:center; width:max-content; background:#dc2626; color:#ffffff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:6px; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); white-space:nowrap; transform:translate(-50%, -100%); pointer-events:none;">Novo Fim: Km ${sliderValue.toFixed(3)}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([endPos.lat, endPos.lng], { icon, zIndexOffset: 1000 }).addTo(lg);
      }

      // Marcador no início da via
      const startPos = trajeto[0];
      if (startPos) {
        const startIcon = L.divIcon({
          className: 'custom-clean-marker',
          html: `<div style="display:inline-flex; align-items:center; width:max-content; background:#16a34a; color:#ffffff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:6px; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); white-space:nowrap; transform:translate(-50%, -100%); pointer-events:none;">Início</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([startPos.lat, startPos.lng], { icon: startIcon, zIndexOffset: 999 }).addTo(lg);
      }
    }

    updateDynamic();

    return () => {
      isMounted = false;
    };
  }, [sliderValue, mapReady, trajeto, viaExtensaoKm]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border bg-muted/20">
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Carregando mapa...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  );
}

export function EditViaGeometryDialog({
  via,
  trajeto,
  trechos,
}: EditViaGeometryDialogProps) {
  const [open, setOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(via.extensaoKm);
  const [isPending, startTransition] = useTransition();

  // Mínimo: Km Final do trecho mais distante (não pode cortar trechos existentes)
  const minExtensao = useMemo(() => {
    if (trechos.length === 0) return SLIDER_STEP;
    return Math.max(...trechos.map((t) => t.kmFinal));
  }, [trechos]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setSliderValue(via.extensaoKm);
    }
  }, [open, via.extensaoKm]);

  const hasChanged = Math.abs(sliderValue - via.extensaoKm) > 0.0005;

  const handleSave = () => {
    if (!trajeto) return;

    startTransition(async () => {
      const trimmedPath = findPathBetweenKms(trajeto, 0, sliderValue);

      const result = await updateViaGeometry(via.id, {
        extensaoKm: sliderValue,
        trajetoJson: trimmedPath,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setOpen(false);
      }
    });
  };

  // Não exibe se não há trajeto
  if (!trajeto || trajeto.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 cursor-pointer text-sm font-medium"
          title="Editar extensão da via"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Ruler className="h-4 w-4" />
          <span>Editar Extensão</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Editar Extensão — {via.name}
          </DialogTitle>
          <DialogDescription>
            Arraste o slider para reduzir a extensão da via. Trechos existentes limitam a redução mínima
            para não deixar nenhum trecho órfão ou cortado.
          </DialogDescription>
        </DialogHeader>

        {/* Mapa interno renderizado somente quando o modal está aberto */}
        {open && (
          <ViaEditMap
            trajeto={trajeto}
            sliderValue={sliderValue}
            viaExtensaoKm={via.extensaoKm}
            trechos={trechos}
          />
        )}

        {/* Legenda visual */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-1.5 rounded-full bg-green-600" />
              <span>Extensão mantida</span>
            </span>
            {sliderValue < via.extensaoKm - 0.001 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-1.5 rounded-full bg-red-600 border border-dashed border-red-700" />
                <span>Extensão a remover</span>
              </span>
            )}
            {trechos.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-1.5 rounded-full bg-blue-500 opacity-70" />
                <span>Trechos cadastrados</span>
              </span>
            )}
          </div>

          {trechos.length > 0 && (
            <span className="text-muted-foreground">
              Limite mínimo imposto por trecho: <strong>Km {minExtensao.toFixed(3)}</strong>
            </span>
          )}
        </div>

        {/* Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span>
              <span className="text-muted-foreground">Início:</span>{' '}
              <span className="font-semibold">Km 0.000</span>
            </span>
            <span>
              <span className="text-muted-foreground">Nova Extensão:</span>{' '}
              <span
                className="font-bold text-base"
                style={{ color: hasChanged ? '#ef4444' : undefined }}
              >
                {sliderValue.toFixed(3)} km
              </span>
              {hasChanged && (
                <span className="text-xs text-muted-foreground ml-2">
                  (era {via.extensaoKm.toFixed(3)} km)
                </span>
              )}
            </span>
          </div>

          <Slider
            min={minExtensao}
            max={via.extensaoKm}
            step={SLIDER_STEP}
            value={[sliderValue]}
            onValueChange={(val) => setSliderValue(val[0])}
            className="py-1"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mín: {minExtensao.toFixed(3)} km</span>
            <span className="text-center font-medium">
              Redução: {(via.extensaoKm - sliderValue).toFixed(3)} km
            </span>
            <span>Máx (atual): {via.extensaoKm.toFixed(3)} km</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanged}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Nova Extensão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
