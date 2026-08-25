import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { StatusAprovacao } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export async function GET(req: Request) {
  try {
    // 1. Autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização ausente' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('A chave secreta JWT não está configurada');
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const userId = decoded.id;

    // 2. Buscar Dados de Base (Vias e Trechos ativos, não suspensos)
    const viaAssignments = await prisma.userViaAssignment.findMany({
      where: { userId: userId },
      select: { viaId: true },
    });
    const assignedViaIds = viaAssignments.map((assignment) => assignment.viaId);

    const vias = await prisma.via.findMany({
      where: {
        id: { in: assignedViaIds },
        isSuspended: false,
      },
    });
    const activeViaIds = vias.map((v) => v.id);

    const trechos = await prisma.trecho.findMany({
      where: {
        viaId: { in: activeViaIds },
        isSuspended: false,
      },
    });
    const assignedTrechoIds = trechos.map((t) => t.id);

    const vistorias = await prisma.vistoria.findMany({
      where: { trechoId: { in: assignedTrechoIds } },
      orderBy: { dataVistoria: 'desc' },
    });

    const patologias = await prisma.patologia.findMany();
    const ocorrencias = await prisma.rdsOcorrencia.findMany();

    // 3. Trava de Segurança de Fotos Aprovadas
    const approvedReports = await prisma.relatorio.findMany({
      where: { statusAprovacao: StatusAprovacao.APROVADO, trechoId: { in: assignedTrechoIds } },
      select: { id: true },
    });
    const approvedReportIds = approvedReports.map((r) => r.id);

    const lockedFotoLinks = await prisma.relatorioFoto.findMany({
      where: { relatorioId: { in: approvedReportIds } },
      select: { fotoId: true },
    });
    const lockedPhotoIds = [...new Set(lockedFotoLinks.map((link) => link.fotoId))];

    // 4. Buscar Fotos de todas as vistorias atribuídas ao usuário
    const vistoriaIds = vistorias.map((v) => v.id);
    const fotos = await prisma.foto.findMany({
      where: { vistoriaId: { in: vistoriaIds } },
      orderBy: { dataCaptura: 'desc' },
    });

    // 5. Retornar Carga Completa
    const syncData = {
      vias,
      trechos,
      vistorias,
      patologias,
      ocorrencias,
      fotos,
      lockedPhotoIds,
      lockedPhotosData,
    };

    return NextResponse.json(syncData, { status: 200 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }
    console.error('Erro ao sincronizar dados:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}