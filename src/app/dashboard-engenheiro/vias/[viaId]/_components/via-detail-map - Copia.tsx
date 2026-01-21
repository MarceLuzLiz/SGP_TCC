'use client';

// --- IMPORTAÇÕES DO REACT E BIBLIOTECAS ---
import {
  useCallback,
  useRef,
  useState,
  useTransition,
  useMemo,
  useEffect,
} from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  MarkerF,
} from '@react-google-maps/api';
import { Foto, Trecho, Patologia, RdsOcorrencia } from '@prisma/client';
import { toast } from 'sonner';
import { createTrecho } from '@/lib/actions/vias';

// --- IMPORTAÇÕES DOS COMPONENTES (ShadCN/UI) ---
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
import { Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// --- DEFINIÇÕES GLOBAIS (Constantes e Tipos) ---
const containerStyle = {
  width: '100%',
  height: '600px',
  borderTopLeftRadius: '0.5rem',
  borderTopRightRadius: '0.5rem',
};

const libraries: ('geometry')[] = ['geometry'];
type Coordenada = { lat: number; lng: number };
const SLIDER_STEP = 0.001; // Precisão de 1 metro
const PENDING_COLOR = '#FF0000'; // Vermelho

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

// --- FUNÇÕES AUXILIARES DE GEOMETRIA ---

/**
 * Encontra a Coordenada (LatLng) exata ao longo de um trajeto
 * para um determinado Km.
 * (Usado para posicionar o marcador do slider)
 */
function findLatLngAtKm(
  trajeto: Coordenada[],
  targetKm: number,
): Coordenada | null {
  if (!window.google?.maps?.geometry || trajeto.length === 0) return null;
  const geometry = window.google.maps.geometry.spherical;
  const targetMeters = targetKm * 1000;
  let accumulatedMeters = 0;

  for (let i = 0; i < trajeto.length - 1; i++) {
    const segmentStart = trajeto[i];
    const segmentEnd = trajeto[i + 1];
    const segmentLength = geometry.computeLength([segmentStart, segmentEnd]);

    // +1m de tolerância para bugs de ponto flutuante
    if (accumulatedMeters + segmentLength + 1 >= targetMeters) {
      const distanceNeeded = targetMeters - accumulatedMeters;
      const fraction = distanceNeeded / segmentLength;
      const safeFraction = Math.max(0, Math.min(1, fraction));
      const latLng = geometry.interpolate(segmentStart, segmentEnd, safeFraction);
      return { lat: latLng.lat(), lng: latLng.lng() };
    }
    accumulatedMeters += segmentLength;
  }
  return trajeto[trajeto.length - 1];
}

/**
 * [FUNÇÃO NOVA E CORRIGIDA]
 * Encontra o traçado (array de Coordenadas) ENTRE dois Kms.
 * (Usado para desenhar os segmentos coloridos dos trechos)
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

    // 1. Encontrar o PONTO INICIAL
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

      // 1b. Caso especial: O trecho inteiro está dentro deste segmento
      if (segmentEndMeters >= metersEnd) {
        const distanceIntoSegmentEnd = metersEnd - accumulatedMeters;
        const fractionEnd = distanceIntoSegmentEnd / segmentLength;
        const endPoint = geometry.interpolate(
          segmentStartLatLng,
          segmentEndLatLng,
          Math.min(1, fractionEnd),
        );
        trechoPath.push({ lat: endPoint.lat(), lng: endPoint.lng() });
        break; // Trecho concluído
      } else {
        // Adiciona o fim deste segmento
        trechoPath.push(segmentEnd);
      }
    }
    // 2. Adicionar PONTOS INTERMEDIÁRIOS
    else if (started && segmentEndMeters < metersEnd) {
      trechoPath.push(segmentEnd);
    }
    // 3. Encontrar o PONTO FINAL
    else if (started && segmentEndMeters >= metersEnd) {
      const distanceIntoSegment = metersEnd - accumulatedMeters;
      const fraction = distanceIntoSegment / segmentLength;
      const endPoint = geometry.interpolate(
        segmentStartLatLng,
        segmentEndLatLng,
        Math.min(1, fraction),
      );
      trechoPath.push({ lat: endPoint.lat(), lng: endPoint.lng() });
      break; // Trecho concluído
    }

    accumulatedMeters += segmentLength;
  }

  return trechoPath;
}

// --- COMPONENTE PRINCIPAL ---

export function ViaDetailMap({
  viaId,
  trajeto,
  fotos,
  trechosExistentes,
  viaExtensaoKm,
}: ViaDetailMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [trechoNome, setTrechoNome] = useState('');
  const [trechoCor, setTrechoCor] = useState('#3b82f6'); // Azul Padrão

  // Calcula o Km inicial do próximo trecho
  const proximoKmInicial = useMemo(() => {
    return trechosExistentes.length > 0
      ? trechosExistentes[trechosExistentes.length - 1].kmFinal
      : 0;
  }, [trechosExistentes]);

  const [sliderValue, setSliderValue] = useState(proximoKmInicial);

  // Efeito para resetar o slider caso os trechos mudem (após salvar)
  useEffect(() => {
    setSliderValue(proximoKmInicial);
  }, [proximoKmInicial]);

  const mapRef = useRef<google.maps.Map | null>(null);

  // Foca o mapa no traçado da via quando o mapa carrega
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (trajeto && Array.isArray(trajeto) && trajeto.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        trajeto.forEach((coord: Coordenada) => {
          bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
        });
        map.fitBounds(bounds);
      }
    },
    [trajeto],
  );

  // Calcula a posição do marcador móvel (controlado pelo slider)
  const movableMarkerPosition = useMemo(() => {
    if (!trajeto || !isLoaded) return null;
    return findLatLngAtKm(trajeto, sliderValue);
  }, [trajeto, sliderValue, isLoaded]);

  // --- AÇÕES DO USUÁRIO ---

  // Abre o modal de confirmação
  const handleOpenModal = () => {
    if (sliderValue <= proximoKmInicial) {
      toast.error('Arraste o slider para definir um Km Final maior que o inicial.');
      return;
    }
    setTrechoNome(`Trecho ${trechosExistentes.length + 1}`);
    setModalOpen(true);
  };

  // Salva o novo trecho
  const handleSaveTrecho = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('viaId', viaId);
      formData.append('nome', trechoNome);
      formData.append('kmInicial', proximoKmInicial.toString());
      formData.append('cor', trechoCor); // Salva a cor

      const kmFinalReal = Math.min(sliderValue, viaExtensaoKm);
      formData.append('kmFinal', kmFinalReal.toString());

      const result = await createTrecho(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setModalOpen(false);
      }
    });
  };

  // Verifica se a via está 100% dividida
  const remainingDistance = viaExtensaoKm - proximoKmInicial;
  const isCompleto = remainingDistance < SLIDER_STEP;

  if (!isLoaded) {
    return (
      <div
        style={containerStyle}
        className="flex items-center justify-center bg-muted"
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
        }}
      >
        {/* --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA --- */}

        {/* 1. Traçado PENDENTE (Vermelho) */}
        {trajeto && !isCompleto && (
          <Polyline
            path={findPathBetweenKm(trajeto, proximoKmInicial, viaExtensaoKm)}
            options={{
              strokeColor: PENDING_COLOR,
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 1, // Camada base
            }}
          />
        )}

        {/* 2. Traçados CONCLUÍDOS (Coloridos) */}
        {trajeto &&
          trechosExistentes.map((trecho) => (
            <Polyline
              key={trecho.id}
              path={findPathBetweenKm(trajeto, trecho.kmInicial, trecho.kmFinal)}
              options={{
                strokeColor: trecho.cor, // Usa a cor salva
                strokeOpacity: 1.0,
                strokeWeight: 6,
                zIndex: 2, // Fica por cima da linha vermelha (se houver)
              }}
            />
          ))}

        {/* 3. Marcador do Slider (Móvel) */}
        {movableMarkerPosition && !isCompleto && (
          <MarkerF
            position={movableMarkerPosition}
            label="Km Final"
            zIndex={99} // Fica por cima de todas as linhas
          />
        )}

        {/* 4. Pins das Fotos */}
        {fotos.map((foto: Foto) => (
          <MarkerF
            key={foto.id}
            position={{ lat: foto.latitude, lng: foto.longitude }}
            zIndex={98} // Fica por baixo do marcador do slider
            // TODO: Adicionar InfoWindow onClick
          />
        ))}
      </GoogleMap>

      {/* PAINEL DE CONTROLE DO SLIDER */}
      {!isCompleto ? (
        <div className="p-4 border-t space-y-4">
          <div>
            <Label>Definir Ponto Final do Trecho</Label>
            <p className="text-sm text-muted-foreground">
              Arraste o slider para posicionar o marcador no mapa.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="font-mono text-sm">
              {proximoKmInicial.toFixed(3)} km
            </span>
            <Slider
              value={[sliderValue]}
              onValueChange={([val]: [number]) => setSliderValue(val)}
              min={proximoKmInicial}
              max={viaExtensaoKm}
              step={SLIDER_STEP}
              className="flex-1"
            />
            <span className="font-mono text-sm">
              {viaExtensaoKm.toFixed(3)} km
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-mono font-bold text-lg">
              Km Final: {sliderValue.toFixed(3)}
            </span>
            <Button onClick={handleOpenModal}>Definir Ponto e Salvar</Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t text-center">
          <p className="font-medium text-green-600">
            ✅ A via está 100% dividida em trechos.
          </p>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Novo Trecho</DialogTitle>
            <DialogDescription>
              Revise os dados, dê um nome e escolha uma cor para o trecho.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Km Inicial</Label>
                <Input value={proximoKmInicial.toFixed(3)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Km Final (Calculado)</Label>
                <Input value={sliderValue.toFixed(3)} disabled />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nome">Nome do Trecho</Label>
                <Input
                  id="nome"
                  value={trechoNome}
                  onChange={(e) => setTrechoNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  type="color"
                  value={trechoCor}
                  onChange={(e) => setTrechoCor(e.target.value)}
                  className="w-full h-10 p-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveTrecho} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Trecho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}