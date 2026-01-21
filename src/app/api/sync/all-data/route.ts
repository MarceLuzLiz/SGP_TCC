// src/app/api/sync/all-data/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, StatusAprovacao } from '@prisma/client'; // Importe o Enum
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface TokenPayload {
  id: string;
}

export async function GET(req: Request) {
  try {
    // 1. Autenticação (continua igual)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização ausente' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('A chave secreta JWT não está configurada');
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const userId = decoded.id;

    // 2. Buscar Dados de Base (Vias, Trechos, Vistorias)
    const viaAssignments = await prisma.userViaAssignment.findMany({
      where: { userId: userId },
      select: { viaId: true },
    });
    const assignedViaIds = viaAssignments.map((assignment) => assignment.viaId);
    const vias = await prisma.via.findMany({ where: { id: { in: assignedViaIds } } });
    const trechos = await prisma.trecho.findMany({ where: { viaId: { in: assignedViaIds } } });
    const assignedTrechoIds = trechos.map(t => t.id);
    const vistorias = await prisma.vistoria.findMany({
      where: { trechoId: { in: assignedTrechoIds } },
      orderBy: { dataVistoria: 'desc' },
    });
    const patologias = await prisma.patologia.findMany();
    const ocorrencias = await prisma.rdsOcorrencia.findMany();

    // ✅ 3. LÓGICA DA TRAVA DE SEGURANÇA
    // Encontra todos os relatórios aprovados
    const approvedReports = await prisma.relatorio.findMany({
      where: { statusAprovacao: StatusAprovacao.APROVADO, trechoId: { in: assignedTrechoIds } },
      select: { id: true }
    });
    const approvedReportIds = approvedReports.map(r => r.id);

    // Encontra os *links* das fotos travadas
    const lockedFotoLinks = await prisma.relatorioFoto.findMany({
      where: { relatorioId: { in: approvedReportIds } },
      select: { fotoId: true }
    });
    const lockedPhotoIds = [...new Set(lockedFotoLinks.map(link => link.fotoId))];

    // ✅ NOVO: Busque os objetos completos das fotos travadas
    const lockedPhotosData = await prisma.foto.findMany({
      where: { id: { in: lockedPhotoIds } }
    });

    // 4. Montar o objeto de resposta
    const syncData = {
      vias, trechos, vistorias, patologias, ocorrencias,
      lockedPhotoIds,
      lockedPhotosData // ✅ Envia os dados completos
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