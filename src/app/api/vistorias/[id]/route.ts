import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { StatusAprovacao } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: vistoriaId } = await params;
    const body = await req.json();
    const { dataVistoria, motivo, trechoId } = body;

    const existingVistoria = await prisma.vistoria.findUnique({
      where: { id: vistoriaId },
    });

    if (!existingVistoria) {
      return NextResponse.json(
        { error: 'Vistoria não encontrada.' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (motivo) updateData.motivo = motivo;
    if (trechoId) updateData.trechoId = trechoId;
    if (dataVistoria) {
      const dataObj = new Date(dataVistoria);
      dataObj.setUTCHours(23, 59, 59, 999);
      const hoje = new Date();
      hoje.setUTCHours(0, 0, 0, 0);
      if (dataObj < hoje) {
        return NextResponse.json(
          { error: 'Não é permitido alterar vistorias para datas retroativas.' },
          { status: 400 }
        );
      }
      updateData.dataVistoria = dataObj;
    }

    const updated = await prisma.vistoria.update({
      where: { id: vistoriaId },
      data: updateData,
    });

    return NextResponse.json({ vistoria: updated }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar vistoria:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar vistoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: vistoriaId } = await params;

    const existingVistoria = await prisma.vistoria.findUnique({
      where: { id: vistoriaId },
    });

    if (!existingVistoria) {
      return NextResponse.json(
        { error: 'Vistoria não encontrada.' },
        { status: 404 }
      );
    }

    // Verificar se há relatórios aprovados vinculados
    const relatorioVinculado = await prisma.relatorio.findFirst({
      where: {
        vistoriaId: vistoriaId,
        statusAprovacao: StatusAprovacao.APROVADO,
      },
    });

    if (relatorioVinculado) {
      return NextResponse.json(
        {
          error:
            'Não é possível excluir esta vistoria pois ela possui relatórios aprovados vinculados.',
        },
        { status: 400 }
      );
    }

    // Excluir fotos e a vistoria
    await prisma.foto.deleteMany({
      where: { vistoriaId: vistoriaId },
    });

    await prisma.vistoria.delete({
      where: { id: vistoriaId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir vistoria:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir vistoria' },
      { status: 500 }
    );
  }
}
