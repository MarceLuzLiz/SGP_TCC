'use client';

import { useState, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  MarkerF, // 1. Importar o <MarkerF />
} from '@react-google-maps/api';
import type { Coordenada } from './create-via-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // 2. Importar o Button
import { X } from 'lucide-react'; // 3. Importar um ícone (opcional)

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
};

// Centro inicial do mapa (Belém, PA)
const center = {
  lat: -1.4558,
  lng: -48.5024,
};

interface CreateViaMapProps {
  onMapChange: (path: Coordenada[], lengthInKm: number) => void;
}

// Habilita a biblioteca 'geometry' (para cálculo de distância)
const libraries: ('geometry' | 'visualization')[] = ['geometry', 'visualization'];

export function CreateViaMap({ onMapChange }: CreateViaMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Estados para o fluxo de "Directions"
  const [origin, setOrigin] = useState<Coordenada | null>(null);
  const [destination, setDestination] = useState<Coordenada | null>(null);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);

  /**
   * Função auxiliar que extrai os dados da rota e
   * envia para o formulário pai.
   */
  const updateParentForm = useCallback(
    (response: google.maps.DirectionsResult | null) => {
      if (response && response.routes && response.routes[0]) {
        const route = response.routes[0];
        const leg = route.legs[0];

        if (leg.distance && leg.steps) {
          const lengthInMeters = leg.distance.value;
          const lengthInKm = lengthInMeters / 1000;
          const path: Coordenada[] = route.overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          onMapChange(path, lengthInKm);
        }
      }
    },
    [onMapChange],
  );

  /**
   * Lida com o clique no mapa para definir Origem e Destino
   */
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    if (directionsResponse) return; // Se já tem rota, não faz nada

    const newCoord = { lat: e.latLng.lat(), lng: e.latLng.lng() };

    if (!origin) {
      setOrigin(newCoord);
      toast.info('Ponto inicial definido. Clique no mapa para definir o ponto final.');
    } else if (!destination) {
      setDestination(newCoord);
      toast.info('Ponto final definido. Calculando rota...');
      calculateRoute(newCoord);
    }
  };

  /**
   * Chama a API do Google Directions
   */
  const calculateRoute = async (endPoint: Coordenada) => {
    if (!origin) return;

    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: origin,
        destination: endPoint,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);
      updateParentForm(results);
    } catch (error) {
      console.error('Erro ao calcular rota: ', error);
      toast.error('Não foi possível encontrar uma rota entre os pontos.');
      setOrigin(null);
      setDestination(null);
    }
  };

  /**
   * Callback para quando o Renderer for carregado.
   */
  const onRendererLoad = useCallback(
    (renderer: google.maps.DirectionsRenderer) => {
      if (renderer) {
        renderer.addListener('directions_changed', () => {
          const newDirections = renderer.getDirections();
          if (newDirections) {
            toast.success('Rota atualizada!');
            updateParentForm(newDirections);
          }
        });
      }
    },
    [updateParentForm],
  );

  /**
   * NOVA FUNÇÃO: Limpa o mapa e reseta o formulário pai.
   */
  const handleClear = () => {
    setOrigin(null);
    setDestination(null);
    setDirectionsResponse(null);
    onMapChange([], 0); // Reseta o formulário pai (extensão e trajeto)
    toast.info('Mapa limpo. Selecione um novo ponto inicial.');
  };

  if (!isLoaded) return <div>Carregando Mapa...</div>;

  return (
    // 4. Wrapper relativo para posicionar o botão de limpar
    <div style={{ position: 'relative' }}>
      <Button
        type="button" // Previne que o botão submeta o formulário
        size="sm"
        variant="destructive"
        onClick={handleClear}
        // 5. Posiciona o botão no canto superior direito do mapa
        className="absolute top-2 right-2 z-10"
      >
        <X className="mr-1 h-4 w-4" />
        Limpar Rota
      </Button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onClick={handleMapClick}
      >
        {/* 6. NOVO: Renderiza o marcador A, mas SÓ se a rota
            ainda não foi calculada (para evitar duplicatas) */}
        {origin && !directionsResponse && (
          <MarkerF
            position={origin}
            label="A"
          />
        )}

        {/* O DirectionsRenderer cuida dos marcadores A e B
            quando a rota é renderizada */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            onLoad={onRendererLoad}
            options={{
              draggable: true,
              polylineOptions: {
                strokeColor: '#FF0000',
                strokeWeight: 4,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}