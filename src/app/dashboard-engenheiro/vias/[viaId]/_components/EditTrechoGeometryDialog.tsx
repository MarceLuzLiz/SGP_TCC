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
import { updateTrechoKms } from '@/lib/actions/vias';
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

interface EditTrechoGeometryDialogProps {
  trecho: TrechoBasic;
  trajeto: Coordenada[] | null;
  viaExtensaoKm: number;
  allTrechos: TrechoBasic[];
}

const SLIDER_STEP = 0.001;

/**
 * Componente interno do mapa, montado SOMENTE quando o Dialog está aberto.
 * Isso garante que o container DOM já existe com dimensões calculadas.
 */
function TrechoEditMap({
  trajeto,
  trecho,
  sliderValue,
  allTrechos,
}: {
  trajeto: Coordenada[];
  trecho: TrechoBasic;
  sliderValue: number;
  allTrechos: TrechoBasic[];
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

      // Camada estática: trajeto completo + outros trechos
      const staticLg = L.layerGroup().addTo(map);

      // Trajeto da via completo (cinza tracejado)
      const fullLatLngs: [number, number][] = trajeto.map((p) => [p.lat, p.lng]);
      L.polyline(fullLatLngs, {
        color: '#94a3b8',
        weight: 4,
        opacity: 0.4,
        dashArray: '6, 6',
      }).addTo(staticLg);

      // Outros trechos da via
      allTrechos
        .filter((t) => t.id !== trecho.id)
        .forEach((t) => {
          const path = findPathBetweenKms(trajeto, t.kmInicial, t.kmFinal);
          if (path.length > 0) {
            const latLngs: [number, number][] = path.map((p) => [p.lat, p.lng]);
            const poly = L.polyline(latLngs, {
              color: t.cor || '#6b7280',
              weight: 5,
              opacity: 0.5,
            }).addTo(staticLg);
            poly.bindTooltip(t.nome, { sticky: true });
          }
        });

      // Camada dinâmica para o trecho editado
      const dynLg = L.layerGroup().addTo(map);
      dynamicLayerRef.current = dynLg;

      // Enquadrar no trajeto da via
      if (fullLatLngs.length > 1) {
        try {
          map.fitBounds(L.latLngBounds(fullLatLngs), { padding: [35, 35] });
        } catch {
          // ignore fitBounds calculation errors
        }
      }

      mapRef.current = map;
      setMapReady(true);

      // Forçar recálculo das dimensões após término da animação do Dialog
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

    // Pequeno delay para garantir que o DialogContent do Radix terminou de renderizar no DOM
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
  }, [trajeto, trecho.id, allTrechos]);

  // 2. Atualização reativa da camada dinâmica conforme o slider é arrastado
  useEffect(() => {
    if (!mapRef.current || !dynamicLayerRef.current || !mapReady) return;

    let isMounted = true;
    async function updateDynamic() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !dynamicLayerRef.current) return;

      const lg = dynamicLayerRef.current;
      lg.clearLayers();

      // Polilinha do trecho com o Km Final atual do slider
      const trechoPath = findPathBetweenKms(trajeto, trecho.kmInicial, sliderValue);
      if (trechoPath.length > 0) {
        const latLngs: [number, number][] = trechoPath.map((p) => [p.lat, p.lng]);
        L.polyline(latLngs, {
          color: trecho.cor || '#3b82f6',
          weight: 7,
          opacity: 0.95,
        }).addTo(lg);
      }

      // Marcador no ponto final móvel
      const endPos = findLatLngAtKm(trajeto, sliderValue);
      if (endPos) {
        const icon = L.divIcon({
          className: 'custom-clean-marker',
          html: `<div style="display:inline-flex; align-items:center; width:max-content; background:#dc2626; color:#ffffff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:6px; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); white-space:nowrap; transform:translate(-50%, -100%); pointer-events:none;">Fim: Km ${sliderValue.toFixed(3)}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([endPos.lat, endPos.lng], { icon, zIndexOffset: 1000 }).addTo(lg);
      }

      // Marcador no ponto inicial fixo
      const startPos = findLatLngAtKm(trajeto, trecho.kmInicial);
      if (startPos) {
        const startIcon = L.divIcon({
          className: 'custom-clean-marker',
          html: `<div style="display:inline-flex; align-items:center; width:max-content; background:#16a34a; color:#ffffff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:6px; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); white-space:nowrap; transform:translate(-50%, -100%); pointer-events:none;">Início: Km ${trecho.kmInicial.toFixed(3)}</div>`,
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
  }, [sliderValue, mapReady, trajeto, trecho.kmInicial, trecho.cor]);

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

export function EditTrechoGeometryDialog({
  trecho,
  trajeto,
  viaExtensaoKm,
  allTrechos,
}: EditTrechoGeometryDialogProps) {
  const [open, setOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(trecho.kmFinal);
  const [isPending, startTransition] = useTransition();

  // Calcula o kmFinal máximo permitido (próximo trecho ou extensão da via)
  const maxKmFinal = useMemo(() => {
    const afterTrechos = allTrechos
      .filter((t) => t.id !== trecho.id && t.kmInicial > trecho.kmInicial)
      .sort((a, b) => a.kmInicial - b.kmInicial);

    return afterTrechos.length > 0 ? afterTrechos[0].kmInicial : viaExtensaoKm;
  }, [allTrechos, trecho.id, trecho.kmInicial, viaExtensaoKm]);

  const minKmFinal = trecho.kmInicial + SLIDER_STEP;

  // Reset do slider ao abrir
  useEffect(() => {
    if (open) {
      setSliderValue(trecho.kmFinal);
    }
  }, [open, trecho.kmFinal]);

  const hasChanged = Math.abs(sliderValue - trecho.kmFinal) > 0.0005;
  const extensaoAtual = (trecho.kmFinal - trecho.kmInicial).toFixed(3);
  const extensaoNova = (sliderValue - trecho.kmInicial).toFixed(3);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateTrechoKms(trecho.id, {
        kmInicial: trecho.kmInicial,
        kmFinal: sliderValue,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setOpen(false);
      }
    });
  };

  // Não exibe o botão se não há trajeto para visualizar
  if (!trajeto || trajeto.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Editar dimensões do trecho"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Ruler className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Editar Dimensões — {trecho.nome}
          </DialogTitle>
          <DialogDescription>
            Arraste o slider para ajustar o Km Final do trecho. O ponto inicial permanece fixo em
            Km {trecho.kmInicial.toFixed(3)}.
          </DialogDescription>
        </DialogHeader>

        {/* Mapa interno renderizado somente quando o modal está aberto */}
        {open && (
          <TrechoEditMap
            trajeto={trajeto}
            trecho={trecho}
            sliderValue={sliderValue}
            allTrechos={allTrechos}
          />
        )}

        {/* Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span>
              <span className="text-muted-foreground">Início:</span>{' '}
              <span className="font-semibold">Km {trecho.kmInicial.toFixed(3)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Fim:</span>{' '}
              <span
                className="font-bold text-base"
                style={{ color: hasChanged ? '#ef4444' : undefined }}
              >
                Km {sliderValue.toFixed(3)}
              </span>
              {hasChanged && (
                <span className="text-xs text-muted-foreground ml-2">
                  (era Km {trecho.kmFinal.toFixed(3)})
                </span>
              )}
            </span>
          </div>

          <Slider
            min={minKmFinal}
            max={maxKmFinal}
            step={SLIDER_STEP}
            value={[sliderValue]}
            onValueChange={(val) => setSliderValue(val[0])}
            className="py-1"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mín: Km {minKmFinal.toFixed(3)}</span>
            <span className="text-center font-medium">
              Extensão: {extensaoNova} km
              {hasChanged && (
                <span className="text-amber-600 ml-1">(era {extensaoAtual} km)</span>
              )}
            </span>
            <span>Máx: Km {maxKmFinal.toFixed(3)}</span>
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
            Salvar Dimensões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
