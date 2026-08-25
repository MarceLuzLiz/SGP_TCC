import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { trechoId, dataVistoria, motivo } = body;

    if (!trechoId || !dataVistoria || !motivo) {
      return NextResponse.json(
        { error: 'Trecho, data da vistoria e motivo são obrigatórios.' },
        { status: 400 }
      );
    }

    const dataObj = new Date(dataVistoria);
    dataObj.setUTCHours(23, 59, 59, 999);

    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    if (dataObj < hoje) {
      return NextResponse.json(
        { error: 'Não é permitido criar vistorias com datas retroativas.' },
        { status: 400 }
      );
    }

    const vistoria = await prisma.vistoria.create({
      data: {
        trechoId,
        dataVistoria: dataObj,
        motivo,
        userId,
      },
    });

    return NextResponse.json({ vistoria }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar vistoria:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar vistoria' },
      { status: 500 }
    );
  }
}
