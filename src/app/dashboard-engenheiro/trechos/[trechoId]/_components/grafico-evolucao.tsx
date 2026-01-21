'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// O tipo de dado que vem da nossa função getIggHistoryForTrecho
interface HistoryPoint {
  data: string;
  igg: number;
}

interface GraficoEvolucaoProps {
  data: HistoryPoint[];
}

export function GraficoEvolucao({ data }: GraficoEvolucaoProps) {
  if (data.length < 2) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        São necessárias ao menos duas vistorias para exibir um gráfico de
        evolução.
      </div>
    );
  }

  return (
    // O ResponsiveContainer faz o gráfico se adaptar ao Card
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -20, // Ajuste para o YAxis
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="data"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
          }}
          labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="igg"
          name="IGG"
          stroke="#ef4444" // Vermelho, indicando gravidade
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}