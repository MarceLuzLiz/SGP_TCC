import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { StatusAprovacao } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ viaId: string }> }
) {
  try {
    // 1. Autenticação via Token JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização ausente' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    const decoded = jwt.verify(token, secret) as TokenPayload;
    if (!decoded.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { viaId } = await context.params;

    // 2. Busca dados da Via
    const via = await prisma.via.findUnique({
      where: { id: viaId },
      select: {
        id: true,
        name: true,
        bairro: true,
        municipio: true,
        estado: true,
        extensaoKm: true,
        estacas: true,
        trajetoJson: true,
        isSuspended: true,
      },
    });

    if (!via || via.isSuspended) {
      return NextResponse.json({ error: 'Via não encontrada ou suspensa' }, { status: 404 });
    }

    // 3. Busca trechos ativos da Via
    const trechos = await prisma.trecho.findMany({
      where: { viaId, isSuspended: false },
      select: {
        id: true,
        nome: true,
        kmInicial: true,
        kmFinal: true,
        cor: true,
        estacas: true,
        viaId: true,
      },
      orderBy: { kmInicial: 'asc' },
    });

    const trechoIds = trechos.map((t) => t.id);
    const trechosMap = new Map(trechos.map((t) => [t.id, t.nome]));

    // 4. Busca Relatórios RFT Aprovados para estes trechos ordenados por data da vistoria decrescente
    const approvedReports = await prisma.relatorio.findMany({
      where: {
        trechoId: { in: trechoIds },
        tipo: 'RFT',
        statusAprovacao: StatusAprovacao.APROVADO,
      },
      include: {
        vistoria: {
          select: { id: true, dataVistoria: true, trechoId: true },
        },
        fotos: {
          select: {
            foto: {
              include: {
                patologia: true,
              },
            },
          },
        },
      },
      orderBy: {
        vistoria: {
          dataVistoria: 'desc',
        },
      },
    });

    // 5. Para cada trecho, seleciona apenas as patologias da vistoria APROVADA mais recente
    const seenTrechos = new Set<string>();
    const patologiasAprovadas: any[] = [];

    for (const report of approvedReports) {
      const trechoId = report.trechoId;
      if (!seenTrechos.has(trechoId)) {
        seenTrechos.add(trechoId);

        const trechoNome = trechosMap.get(trechoId) || 'Trecho';
        const dataVistoria = report.vistoria?.dataVistoria;

        for (const item of report.fotos) {
          const foto = item.foto;
          if (foto && foto.patologia && foto.latitude && foto.longitude) {
            patologiasAprovadas.push({
              id: foto.id,
              trechoId: foto.trechoId,
              trechoNome: trechoNome,
              vistoriaId: foto.vistoriaId,
              dataVistoria: dataVistoria,
              latitude: foto.latitude,
              longitude: foto.longitude,
              estaca: foto.estaca,
              grauSeveridade: foto.grauSeveridade,
              extensaoM: foto.extensaoM,
              larguraM: foto.larguraM,
              dataCaptura: foto.dataCaptura,
              imageUrl: foto.imageUrl,
              patologia: {
                id: foto.patologia.id,
                codigoDnit: foto.patologia.codigoDnit,
                classificacaoEspecifica: foto.patologia.classificacaoEspecifica,
                mapeamentoIgg: foto.patologia.mapeamentoIgg,
                fatorPonderacao: foto.patologia.fatorPonderacao,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      via,
      trechos,
      patologiasAprovadas,
      totalPatologias: patologiasAprovadas.length,
      downloadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar pacote offline da via:', error);
    return NextResponse.json({ error: 'Erro interno ao processar pacote offline' }, { status: 500 });
  }
}
