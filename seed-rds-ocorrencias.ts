import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de ocorrências padrão para fotos de RDS
const ocorrenciasPadrao = [
  { categoria: 'Equipe', ocorrencia: 'Equipe em campo' },
  { categoria: 'Equipe', ocorrencia: 'Reunião de segurança (DDS)' },
  { categoria: 'Equipe', ocorrencia: 'Mobilização de equipe' },
  { categoria: 'Equipamentos', ocorrencia: 'Equipamento posicionado' },
  { categoria: 'Equipamentos', ocorrencia: 'Manutenção de equipamento' },
  { categoria: 'Condições', ocorrencia: 'Condições climáticas' },
  { categoria: 'Condições', ocorrencia: 'Condições do tráfego' },
  { categoria: 'Condições', ocorrencia: 'Pista molhada' },
  { categoria: 'Serviços', ocorrencia: 'Instalação de sinalização' },
  { categoria: 'Serviços', ocorrencia: 'Medição topográfica' },
  { categoria: 'Serviços', ocorrencia: 'Limpeza da pista' },
  { categoria: 'Outros', ocorrencia: 'Visita de supervisão' },
];

async function main() {
  console.log('Iniciando o script para popular a tabela de ocorrências de RDS...');

  // Limpa a tabela para evitar duplicatas em execuções futuras
  await prisma.rdsOcorrencia.deleteMany({});

  // Insere os dados padrão
  await prisma.rdsOcorrencia.createMany({
    data: ocorrenciasPadrao,
  });

  console.log(`Sucesso! ${ocorrenciasPadrao.length} ocorrências de RDS foram inseridas no banco de dados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });