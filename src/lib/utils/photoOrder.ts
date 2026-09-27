/**
 * Utilitário para ordenação consistente de fotos por estaca e cronologia.
 */

/**
 * Converte qualquer representação de estaca em um número contínuo para ordenação precisa.
 * Exemplos:
 *  - "0" ou "E0" -> 0.0
 *  - "1" ou "E1" ou "Estaca 1" -> 1.0
 *  - "1 + 10 m" ou "E1+10m" -> 1.5 (1 + 10/20)
 *  - "2" ou "E2" -> 2.0
 *  - "10" -> 10.0
 *  - null / undefined / "N/D" -> Infinity (fica ao final)
 */
export function parseEstacaToNumber(estacaStr?: string | null): number {
  if (!estacaStr) return Infinity;

  const raw = String(estacaStr).trim();
  if (!raw || raw.toUpperCase() === 'N/D' || raw.toUpperCase() === 'N/A') {
    return Infinity;
  }

  // Remove prefixos como "Estaca", "ESTACA", "E", "Est."
  const clean = raw
    .replace(/^estaca\s*/i, '')
    .replace(/^est\.?\s*/i, '')
    .replace(/^e\s*/i, '')
    .trim();

  // Caso: "1 + 10 m" ou "1+10" ou "1 + 10.5m"
  const matchCompound = clean.match(/^(\d+)(?:\s*\+\s*(\d+(?:[.,]\d+)?)\s*m?)?$/i);
  if (matchCompound) {
    const base = parseInt(matchCompound[1], 10);
    const meters = matchCompound[2] ? parseFloat(matchCompound[2].replace(',', '.')) : 0;
    return base + meters / 20; // padrão oficial: cada estaca tem 20 metros
  }

  // Caso geral: pega o primeiro número encontrado
  const matchNum = clean.match(/(\d+(?:[.,]\d+)?)/);
  if (matchNum) {
    return parseFloat(matchNum[1].replace(',', '.'));
  }

  return Infinity;
}

/**
 * Ordena fotos estritamente da estaca inicial (ex: 0, 1, 2...) em diante.
 * Se duas fotos estiverem na mesma estaca, desempata pela data de captura (mais antiga primeiro).
 * Fotos sem estaca ficam ao final, ordenadas por data.
 */
export function sortFotosByEstaca<
  T extends { estaca?: string | null; dataCaptura?: Date | string | null }
>(fotos: T[]): T[] {
  if (!fotos || fotos.length <= 1) return fotos ? [...fotos] : [];

  return [...fotos].sort((a, b) => {
    const valA = parseEstacaToNumber(a.estaca);
    const valB = parseEstacaToNumber(b.estaca);

    if (valA !== valB) {
      return valA - valB;
    }

    const timeA = a.dataCaptura ? new Date(a.dataCaptura).getTime() : 0;
    const timeB = b.dataCaptura ? new Date(b.dataCaptura).getTime() : 0;
    return timeA - timeB;
  });
}
