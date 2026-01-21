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
import { Loader2, Milestone } from 'lucide-react'; // <--- Ícone Milestone adicionado
import { Slider } from '@/components/ui/slider';

// --- DEFINIÇÕES GLOBAIS (Constantes e Tipos) ---
const containerStyle = {
  width: '100%',
  height: '600px',
  borderTopLeftRadius: '0.5rem',
  borderTopRightRadius: '0.5rem',
};

// Adicione 'visualization' aqui para bater com a configuração do Mapa de Calor
const libraries: ('geometry' | 'visualization')[] = ['geometry', 'visualization'];
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

interface PontoEstaca {
  coord: Coordenada;
  numero: number;
  label: string;
}

// --- FUNÇÕES AUXILIARES DE GEOMETRIA ---

/**
 * Encontra a Coordenada (LatLng) exata ao longo de um trajeto para um determinado Km.
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
 * Gera pontos de estacas. 
 * Adaptada para aceitar 'intervalo' customizado (ex: 100m para visão macro).
 */
function gerarPontosEstacasGoogle(
  path: Coordenada[],
  kmInicialAbsoluto: number,
  intervalo: number = 20
): PontoEstaca[] {
  if (!window.google?.maps?.geometry || path.length < 2) return [];
  
  const geometry = window.google.maps.geometry.spherical;
  const pontos: PontoEstaca[] = [];
  
  const offsetInicial = kmInicialAbsoluto * 1000;
  
  // Define a próxima meta baseada no intervalo (ex: a cada 100m)
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
      
      // O número da estaca é sempre baseado na regra de 20m
      const numEstacaReal = Math.round(proximaMeta / 20);

      pontos.push({
        coord: { lat: pEstaca.lat(), lng: pEstaca.lng() },
        numero: numEstacaReal,
        label: `${numEstacaReal}`
      });

      proximaMeta += intervalo;
    }
    distanciaPercorridaNoPath += distSegmento;
  }

  return pontos;
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
  
  // --- ESTADO PARA CONTROLAR A VISIBILIDADE DAS ESTACAS ---
  const [showEstacas, setShowEstacas] = useState(false);

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

  useEffect(() => {
    setSliderValue(proximoKmInicial);
  }, [proximoKmInicial]);

  const mapRef = useRef<google.maps.Map | null>(null);

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

  const movableMarkerPosition = useMemo(() => {
    if (!trajeto || !isLoaded) return null;
    return findLatLngAtKm(trajeto, sliderValue);
  }, [trajeto, sliderValue, isLoaded]);

  // --- GERAÇÃO DAS ESTACAS DA VIA INTEIRA ---
  const estacasPoints = useMemo(() => {
    // Aqui usamos um intervalo de 100m (5 estacas) para não poluir
    return isLoaded && trajeto && trajeto.length > 0
      ? gerarPontosEstacasGoogle(trajeto, 0, 100) 
      : [];
  }, [isLoaded, trajeto]);

  // --- AÇÕES DO USUÁRIO ---
  const handleOpenModal = () => {
    if (sliderValue <= proximoKmInicial) {
      toast.error('Arraste o slider para definir um Km Final maior que o inicial.');
      return;
    }
    setTrechoNome(`Trecho ${trechosExistentes.length + 1}`);
    setModalOpen(true);
  };

  const handleSaveTrecho = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('viaId', viaId);
      formData.append('nome', trechoNome);
      formData.append('kmInicial', proximoKmInicial.toString());
      formData.append('cor', trechoCor);

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

  const remainingDistance = viaExtensaoKm - proximoKmInicial;
  const isCompleto = remainingDistance < SLIDER_STEP;

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="relative group"> {/* Wrapper relativo para o botão */}
        
        {/* BOTÃO FLUTUANTE DE ESTACAS */}
        <div className="absolute top-2 right-16 z-10">
          <Button
            variant={showEstacas ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowEstacas(!showEstacas)}
            className="shadow-md h-8 text-xs gap-2"
            title={showEstacas ? "Ocultar Estacas" : "Mostrar Estacas (a cada 100m)"}
          >
            <Milestone className="h-4 w-4" />
            {showEstacas ? "Ocultar Estacas" : "Ver Estacas"}
          </Button>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={14}
          onLoad={onMapLoad}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
          }}
        >
          {/* 1. Traçado PENDENTE (Vermelho) */}
          {trajeto && !isCompleto && (
            <Polyline
              path={findPathBetweenKm(trajeto, proximoKmInicial, viaExtensaoKm)}
              options={{ strokeColor: PENDING_COLOR, strokeOpacity: 0.8, strokeWeight: 6, zIndex: 1 }}
            />
          )}

          {/* 2. Traçados CONCLUÍDOS (Coloridos) */}
          {trajeto && trechosExistentes.map((trecho) => (
            <Polyline
              key={trecho.id}
              path={findPathBetweenKm(trajeto, trecho.kmInicial, trecho.kmFinal)}
              options={{ strokeColor: trecho.cor, strokeOpacity: 1.0, strokeWeight: 6, zIndex: 2 }}
            />
          ))}

          {/* 3. Marcador do Slider */}
          {movableMarkerPosition && !isCompleto && (
            <MarkerF position={movableMarkerPosition} label="Km Final" zIndex={99} />
          )}

          {/* 4. BALÕES DAS ESTACAS (CONDICIONAL) */}
          {showEstacas && estacasPoints.map((estaca) => (
            <MarkerF
              key={`estaca-via-${estaca.numero}`}
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

          {/* 5. Pins das Fotos */}
          {fotos.map((foto: Foto) => (
            <MarkerF
              key={foto.id}
              position={{ lat: foto.latitude, lng: foto.longitude }}
              zIndex={98}
            />
          ))}
        </GoogleMap>
      </div>

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

      {/* MODAL (Mantido igual) */}
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