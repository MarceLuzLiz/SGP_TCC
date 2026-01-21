'use client';

interface IggDisplayProps {
  igg: number;
  n?: number;
}

// --- NOVAS REGRAS DE CLASSIFICAÇÃO ---
const IGG_LIMITES = {
  OTIMO: 20,    // 0 < IGG <= 20
  BOM: 40,      // 20 < IGG <= 40
  REGULAR: 80,  // 40 < IGG <= 80
  RUIM: 160,    // 80 < IGG <= 160
  // PÉSSIMO: IGG > 160
};

export function IggDisplay({ igg, n }: IggDisplayProps) {
  const iggFormatado = igg.toFixed(2);

  let cor = 'text-green-600'; // Cor para Ótimo
  let texto = 'Ótimo';

  if (igg > IGG_LIMITES.RUIM) { // > 160
    cor = 'text-red-700'; // Vermelho Escuro (Péssimo)
    texto = 'Péssimo';
  } else if (igg > IGG_LIMITES.REGULAR) { // > 80 (até 160)
    cor = 'text-red-500'; // Vermelho (Ruim)
    texto = 'Ruim';
  } else if (igg > IGG_LIMITES.BOM) { // > 40 (até 80)
    cor = 'text-orange-500'; // Laranja (Regular)
    texto = 'Regular';
  } else if (igg > IGG_LIMITES.OTIMO) { // > 20 (até 40)
    cor = 'text-yellow-500'; // Amarelo (Bom)
    texto = 'Bom';
  } else if (igg <= 0) { // Caso IGG seja 0
    cor = 'text-gray-500';
    texto = 'N/A';
  }
  // Se for > 0 e <= 20, ele mantém o padrão 'Ótimo'

  return (
    <div className="text-center">
      <h2 className={`text-6xl font-bold ${cor}`}>{iggFormatado}</h2>
      <p className={`text-xl font-medium ${cor}`}>({texto})</p>
      <p className="text-xs text-muted-foreground mt-2">
        IGG (Índice de Gravidade Global) da vistoria mais recente.
      </p>
      {n && (
        <p className="text-xs text-muted-foreground w-full text-center">
          Base: {n} Estações
        </p>
      )}
    </div>
  );
}