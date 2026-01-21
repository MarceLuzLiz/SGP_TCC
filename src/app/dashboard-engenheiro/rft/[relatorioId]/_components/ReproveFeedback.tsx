'use client';
import { AlertCircle } from 'lucide-react';

export function ReproveFeedback({ motivo }: { motivo: string }) {
  return (
    <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
      <div className="flex">
        <div className="shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-red-800">
            Relatório Reprovado
          </h3>
          <p className="mt-1 text-sm text-red-700">
            <strong>Motivo:</strong> {motivo}
          </p>
        </div>
      </div>
    </div>
  );
}