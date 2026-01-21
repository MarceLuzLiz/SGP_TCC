// src/lib/formatters.ts

/**
 * Converte uma distância em quilômetros para o formato de estacas (ex: 5 + 10m).
 * @param km A distância em quilômetros.
 * @returns Uma string formatada em estacas e metros.
 */
export function formatKmToStakes(km: number): string {
  if (km === null || isNaN(km)) {
    return 'N/A';
  }
  const totalMeters = km * 1000;
  const stakes = Math.floor(totalMeters / 20);
  const remainingMeters = totalMeters % 20;

  // Arredonda os metros restantes para evitar muitas casas decimais
  const roundedMeters = Math.round(remainingMeters); 
  
  if (roundedMeters > 0) {
    return `${stakes} + ${roundedMeters}m`;
  } else {
    return `${stakes}`;
  }
}

/**
 * Converte uma string de estaca (ex: "5+250") em metros totais.
 * ATENÇÃO: A lógica aqui assume o formato "ESTACAS+METROS". Ex: "5+10" = 110m.
 * Se o formato na engenharia for diferente, esta função deve ser ajustada.
 * @param stakeString A string da estaca (ex: "5+10").
 * @returns O valor total em metros.
 */
export function parseStakeToMeters(stakeString: string): number {
  if (!stakeString || !stakeString.includes('+')) {
    return 0;
  }
  const parts = stakeString.split('+');
  const stakes = parseInt(parts[0], 10);
  const meters = parseFloat(parts[1]);

  if (isNaN(stakes) || isNaN(meters)) {
    return 0;
  }

  return stakes * 20 + meters;
}