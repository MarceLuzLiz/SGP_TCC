import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o script para popular a tabela de patologias (versão correta)...');

  // Use o nome do arquivo que você enviou
  const filePath = path.join(process.cwd(), 'tabela de igg.csv');

  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo não encontrado em ${filePath}`);
    return;
  }

  const csvFile = fs.readFileSync(filePath, 'utf8');

  await prisma.patologia.deleteMany({});
  console.log('Tabela de patologias limpa com sucesso.');
  console.log('Lendo o arquivo CSV e inserindo os dados...');
  
  Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const patologiasParaCriar = [];

      for (const row of results.data as any[]) {
        // --- MAPEAMENTO CORRIGIDO DAS COLUNAS ---
        const classificacaoEspecifica = row['Classificação Específica'];
        const codigoDnit = row['Código (DNIT)'];
        const mapeamentoIgg = row['Mapeamento para Cálculo do IGG (Tipo)'];
        // Converte a vírgula do Fator de Ponderação para ponto e depois para número
        const fatorPonderacaoStr = row['Fator de ponderação'];
        
        // Validação
        if (classificacaoEspecifica && codigoDnit && mapeamentoIgg && fatorPonderacaoStr) {
          const fatorPonderacao = parseFloat(fatorPonderacaoStr.replace(',', '.'));

          if (!isNaN(fatorPonderacao)) {
            patologiasParaCriar.push({
              classificacaoEspecifica,
              codigoDnit,
              mapeamentoIgg,
              fatorPonderacao,
            });
          }
        }
      }

      if (patologiasParaCriar.length > 0) {
        await prisma.patologia.createMany({
          data: patologiasParaCriar,
          skipDuplicates: true,
        });
        console.log(`Sucesso! ${patologiasParaCriar.length} tipos de patologia foram inseridos no banco de dados.`);
      } else {
        console.log('Nenhum dado válido encontrado no arquivo CSV para inserir.');
      }
    },
    error: (error: any) => {
      console.error('Erro ao parsear o arquivo CSV:', error);
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });