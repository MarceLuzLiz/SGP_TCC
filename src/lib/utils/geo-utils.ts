// Calcula a distância em metros entre duas coordenadas (Haversine)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Raio da terra em metros
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

interface Coordenada {
  lat: number;
  lng: number;
}

export interface PontoEstaca {
  coord: Coordenada;
  numeroEstaca: number;
  label: string; // Ex: "10 + 5"
}

/**
 * Gera pontos de coordenadas ao longo de um trajeto a cada X metros.
 * @param path Array de coordenadas da via/trecho
 * @param startKm Km inicial absoluto desse trajeto (para rotular corretamente)
 * @param intervalMeters De quanto em quanto tempo criar um balão (padrão 20m)
 */
export function gerarPontosDeEstaqueamento(
  path: Coordenada[], 
  startKm: number = 0, 
  intervalMeters: number = 20
): PontoEstaca[] {
  if (!path || path.length < 2) return [];

  const pontosGerados: PontoEstaca[] = [];
  
  let distanciaAcumulada = 0; // Distância percorrida no path
  let proximaMeta = 0; // Próximo ponto onde devemos colocar um balão (0, 20, 40...)
  
  // Define o offset inicial baseado no KM (ex: se o trecho começa no km 1, o offset é 1000m)
  const offsetInicial = startKm * 1000; 
  
  // Ajusta a primeira meta para a próxima estaca inteira após o início
  // Ex: Se começa em 1005m, a primeira estaca cheia é a 1020m
  const resto = offsetInicial % intervalMeters;
  if (resto > 0) {
      proximaMeta = intervalMeters - resto;
  }

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    
    const distSegmento = getDistanceFromLatLonInMeters(p1.lat, p1.lng, p2.lat, p2.lng);

    // Enquanto a próxima meta estiver DENTRO deste segmento atual
    while (distanciaAcumulada + distSegmento >= proximaMeta) {
      // Falta quanto para chegar na meta a partir de p1?
      const distanceToPoint = proximaMeta - distanciaAcumulada;
      
      // Fração do segmento (0.0 a 1.0)
      const fraction = distanceToPoint / distSegmento;

      // Interpolação Linear para achar a lat/lng exata
      const newLat = p1.lat + (p2.lat - p1.lat) * fraction;
      const newLng = p1.lng + (p2.lng - p1.lng) * fraction;

      // Calcula qual é o número real dessa estaca na via
      const metrosTotaisAbsolutos = offsetInicial + proximaMeta;
      const numeroEstaca = Math.floor(metrosTotaisAbsolutos / 20);

      pontosGerados.push({
        coord: { lat: newLat, lng: newLng },
        numeroEstaca: numeroEstaca,
        label: `${numeroEstaca}`
      });

      // Avança para a próxima meta (ex: +20m)
      proximaMeta += intervalMeters;
    }

    distanciaAcumulada += distSegmento;
  }

  return pontosGerados;
}