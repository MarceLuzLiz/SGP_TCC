import { PrismaClient, FotoTipo } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding de dados com a estrutura correta de patologia/RDS...');
  
  // 1. Buscas iniciais por dados de base
  const fiscalUser = await prisma.user.findUnique({ where: { email: 'fiscal@sgp.com' } });
  if (!fiscalUser) {
    console.error('Usuário fiscal de teste não encontrado. Execute create-test-user.ts primeiro.');
    return;
  }

  // Busca patologias pelo código DNIT para usar nos testes de RFT
  const patologiaTrincaJacare = await prisma.patologia.findUnique({ where: { codigoDnit: 'TB' } });
  const patologiaPanela = await prisma.patologia.findUnique({ where: { codigoDnit: 'P' } });
  
  if (!patologiaTrincaJacare || !patologiaPanela) {
    console.error('Patologias de teste (F-1, D-3) não encontradas. Execute seed-patologias.ts primeiro.');
    return;
  }

  // Busca uma ocorrência de RDS para usar no teste de foto RDS
  const rdsOcorrenciaEquipe = await prisma.rdsOcorrencia.findFirst({ where: { ocorrencia: 'Equipe em campo' } });
  if (!rdsOcorrenciaEquipe) {
    console.error('Ocorrência de RDS de teste não encontrada. Execute seed-rds-ocorrencias.ts primeiro.');
    return;
  }
  console.log('Dados de base (usuário, patologias, ocorrência RDS) encontrados com sucesso.');

  // 2. Limpar dados antigos em ordem de dependência
  console.log('Limpando dados antigos...');
  await prisma.relatorioFoto.deleteMany({});
  await prisma.foto.deleteMany({});
  await prisma.relatorio.deleteMany({});
  await prisma.vistoria.deleteMany({});
  await prisma.trecho.deleteMany({});
  await prisma.via.deleteMany({});
  await prisma.userViaAssignment.deleteMany({});

  // 3. Criar nova estrutura de dados
  const via1 = await prisma.via.create({
  data: {
    name: 'Avenida Independência',
    bairro: 'Cabanagem',
    municipio: 'Belém',
    estado: 'PA',
    extensaoKm: 10.5,
    trajetoJson: [] // <--- ADICIONE ISTO
  },
});
  const trecho1Via1 = await prisma.trecho.create({ data: { nome: 'Trecho 1 - Indep.', kmInicial: 0.0, kmFinal: 5.25, viaId: via1.id } });
  await prisma.userViaAssignment.create({ data: { userId: fiscalUser.id, viaId: via1.id } });
  const vistoria1 = await prisma.vistoria.create({ data: { trechoId: trecho1Via1.id, userId: fiscalUser.id, dataVistoria: new Date('2025-10-20T10:00:00Z'), motivo: 'Rotina Semanal' } });

  // 4. Criar Fotos de Teste com as novas relações corretas
  console.log('Criando fotos de teste com a nova estrutura...');
  await prisma.foto.createMany({
    data: [
      // Foto do tipo RFT, com patologiaId preenchido
      {
        trechoId: trecho1Via1.id,
        userId: fiscalUser.id,
        vistoriaId: vistoria1.id,
        tipo: FotoTipo.RFT,
        imageUrl: 'https://res.cloudinary.com/dy8cztf79/image/upload/v1756511612/cld-sample-4.jpg',
        latitude: -1.385, longitude: -48.445,
        dataCaptura: vistoria1.dataVistoria,
        descricao: 'Grande área com trincas interligadas.',
        grauSeveridade: 'Alto',
        extensaoM: 3.5, larguraM: 2.0,
        patologiaId: patologiaTrincaJacare.id, // Vínculo correto
        rdsOcorrenciaId: null, // Campo de RDS é nulo
      },
      // Outra foto do tipo RFT
      {
        trechoId: trecho1Via1.id,
        userId: fiscalUser.id,
        vistoriaId: vistoria1.id,
        tipo: FotoTipo.RFT,
        imageUrl: 'https://res.cloudinary.com/dy8cztf79/image/upload/v1756511612/cld-sample-2.jpg',
        latitude: -1.386, longitude: -48.446,
        dataCaptura: vistoria1.dataVistoria,
        descricao: 'Panela com aproximadamente 30cm de diâmetro.',
        grauSeveridade: 'Médio',
        extensaoM: 0.3, larguraM: 0.3,
        patologiaId: patologiaPanela.id, // Vínculo correto
        rdsOcorrenciaId: null,
      },
      // Foto do tipo RDS, com rdsOcorrenciaId preenchido
      {
        trechoId: trecho1Via1.id,
        userId: fiscalUser.id,
        vistoriaId: vistoria1.id,
        tipo: FotoTipo.RDS,
        imageUrl: 'https://res.cloudinary.com/dy8cztf79/image/upload/v1756511612/cld-sample-3.jpg',
        latitude: -1.385, longitude: -48.445,
        dataCaptura: vistoria1.dataVistoria,
        descricao: 'Equipe iniciando os trabalhos de medição.',
        patologiaId: null, // Campo de patologia é nulo
        rdsOcorrenciaId: rdsOcorrenciaEquipe.id, // Vínculo correto
      },
    ],
  });
  console.log('Fotos de teste criadas com sucesso.');
  console.log('Seeding concluído! ✅');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });