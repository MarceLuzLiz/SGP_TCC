// src/lib/geoUtils.ts

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface PontoEstaca {
  coord: Coordenada;
  numero: number;
  label: string;
}

/**
 * Calcula a distância geodésica em metros entre dois pontos (Fórmula de Haversine).
 */
export function computeDistanceMeters(p1: Coordenada, p2: Coordenada): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula a extensão total em metros de uma polilinha.
 */
export function computePolylineLengthMeters(path: Coordenada[]): number {
  if (!path || path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += computeDistanceMeters(path[i], path[i + 1]);
  }
  return total;
}

/**
 * Encontra a coordenada exata interpolada para um determinado KM ao longo do traçado.
 */
export function findLatLngAtKm(path: Coordenada[], targetKm: number): Coordenada | null {
  if (!path || path.length === 0) return null;
  if (targetKm <= 0) return path[0];

  const totalMeters = computePolylineLengthMeters(path);
  const targetMeters = targetKm * 1000;

  // Se o Km alvo for no final da via (ou além), retorna o último ponto exato
  if (targetMeters >= totalMeters - 5) {
    return path[path.length - 1];
  }

  let accumulatedMeters = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const segmentLength = computeDistanceMeters(start, end);

    if (segmentLength === 0) continue;

    if (accumulatedMeters + segmentLength >= targetMeters) {
      const distanceNeeded = targetMeters - accumulatedMeters;
      const fraction = Math.max(0, Math.min(1, distanceNeeded / segmentLength));
      return {
        lat: start.lat + (end.lat - start.lat) * fraction,
        lng: start.lng + (end.lng - start.lng) * fraction,
      };
    }
    accumulatedMeters += segmentLength;
  }

  return path[path.length - 1];
}

/**
 * Recorta o sub-traçado de coordenadas entre dois KMs (ex: Km Inicial ao Km Final do Trecho).
 * Garante que o início e o final da via nunca fiquem cortados.
 */
export function findPathBetweenKms(path: Coordenada[], kmStart: number, kmEnd: number): Coordenada[] {
  if (!path || path.length < 2) return [];
  if (kmStart >= kmEnd) return [];

  const totalMeters = computePolylineLengthMeters(path);
  if (totalMeters <= 0) return [];

  const metersStart = kmStart * 1000;
  const metersEnd = kmEnd * 1000;
  const isStartAtZero = kmStart <= 0.001;
  const isEndAtTotal = metersEnd >= totalMeters - 30 || kmEnd >= (totalMeters / 1000) - 0.04;

  const result: Coordenada[] = [];
  let accumulatedMeters = 0;
  let started = false;

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const segmentLength = computeDistanceMeters(start, end);
    const segmentEndMeters = accumulatedMeters + segmentLength;

    // Início do trecho
    if (!started && segmentEndMeters >= metersStart) {
      started = true;
      if (isStartAtZero && i === 0) {
        result.push(path[0]);
      } else {
        const distIntoSegment = Math.max(0, metersStart - accumulatedMeters);
        const fraction = segmentLength > 0 ? distIntoSegment / segmentLength : 0;
        result.push({
          lat: start.lat + (end.lat - start.lat) * fraction,
          lng: start.lng + (end.lng - start.lng) * fraction,
        });
      }
    }

    // Pontos intermediários
    if (started) {
      if (segmentEndMeters < metersEnd && !isEndAtTotal) {
        result.push(end);
      } else if (isEndAtTotal) {
        result.push(end);
      } else {
        // Fim do trecho intermediário interpolado
        const distIntoSegment = Math.max(0, metersEnd - accumulatedMeters);
        const fraction = segmentLength > 0 ? distIntoSegment / segmentLength : 1;
        result.push({
          lat: start.lat + (end.lat - start.lat) * fraction,
          lng: start.lng + (end.lng - start.lng) * fraction,
        });
        break;
      }
    }

    accumulatedMeters = segmentEndMeters;
  }

  // Garante que o último ponto da via esteja presente no trecho final
  if (isEndAtTotal && result.length > 0) {
    const lastPoint = path[path.length - 1];
    const currentLast = result[result.length - 1];
    if (currentLast.lat !== lastPoint.lat || currentLast.lng !== lastPoint.lng) {
      result.push(lastPoint);
    }
  }

  return result;
}

/**
 * Calcula os pontos de estacas oficiais da engenharia rodoviária (Norma DNIT: 1 Estaca = 20m).
 * Suporta deslocamento inicial (startOffsetMeters) para que trechos intermediários mantenham
 * o estaqueamento absoluto em relação à via (ex: início a 88m -> E4+8m, 100m -> E5, etc).
 *
 * @param path Coordenadas da polilinha
 * @param intervalMeters Intervalo de amostragem em metros (padrão: 20m para todas as estacas)
 * @param startOffsetMeters Deslocamento inicial em metros a partir do início da via (kmInicial * 1000)
 */
export function calculateStakes(
  path: Coordenada[],
  intervalMeters: number = 20,
  startOffsetMeters: number = 0
): PontoEstaca[] {
  if (!path || path.length < 2) return [];

  const segmentLengthMeters = computePolylineLengthMeters(path);
  if (segmentLengthMeters <= 0) return [];

  const stakes: PontoEstaca[] = [];

  // 1. Estaca do Ponto Inicial do Trecho/Via
  const initialGlobalMeters = startOffsetMeters;
  const initialStakeNum = Math.floor(initialGlobalMeters / 20);
  const initialRemaining = Math.round(initialGlobalMeters % 20);
  const initialLabel =
    initialRemaining > 0
      ? `E${initialStakeNum}+${initialRemaining}m`
      : `E${initialStakeNum}`;

  stakes.push({
    coord: path[0],
    numero: initialStakeNum,
    label: initialLabel,
  });

  // 2. Próxima estaca inteira (múltiplo de 20m)
  let nextGlobalDist =
    initialRemaining === 0
      ? initialGlobalMeters + intervalMeters
      : Math.ceil(initialGlobalMeters / intervalMeters) * intervalMeters;

  let currentRelativeDist = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const segmentDist = computeDistanceMeters(start, end);

    if (segmentDist === 0) continue;

    while (
      nextGlobalDist - initialGlobalMeters <= currentRelativeDist + segmentDist &&
      nextGlobalDist - initialGlobalMeters < segmentLengthMeters - 2
    ) {
      const targetRelativeDist = nextGlobalDist - initialGlobalMeters;
      const distIntoSegment = targetRelativeDist - currentRelativeDist;
      const ratio = distIntoSegment / segmentDist;

      const stakeNum = Math.floor(nextGlobalDist / 20);
      const remainingMeters = Math.round(nextGlobalDist % 20);
      const labelStr =
        remainingMeters === 0
          ? `E${stakeNum}`
          : `E${stakeNum}+${remainingMeters}m`;

      stakes.push({
        coord: {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio,
        },
        numero: stakeNum,
        label: labelStr,
      });

      nextGlobalDist += intervalMeters;
    }

    currentRelativeDist += segmentDist;
  }

  // 3. Estaca do Ponto Final do Trecho/Via
  const finalGlobalMeters = initialGlobalMeters + segmentLengthMeters;
  const finalStakeNum = Math.floor(finalGlobalMeters / 20);
  const finalRemaining = Math.round(finalGlobalMeters % 20);
  const finalLabel =
    finalRemaining > 0
      ? `E${finalStakeNum}+${finalRemaining}m`
      : `E${finalStakeNum}`;

  // Adiciona a estaca final garantindo que não duplica se for muito próxima
  const lastStake = stakes[stakes.length - 1];
  if (!lastStake || lastStake.label !== finalLabel) {
    stakes.push({
      coord: path[path.length - 1],
      numero: finalStakeNum,
      label: finalLabel,
    });
  }

  return stakes;
}
