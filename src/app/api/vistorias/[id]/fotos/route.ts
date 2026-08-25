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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: vistoriaId } = await params;

    const fotos = await prisma.foto.findMany({
      where: { vistoriaId },
      orderBy: { dataCaptura: 'desc' },
    });

    return NextResponse.json({ fotos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar fotos da vistoria:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar fotos da vistoria' },
      { status: 500 }
    );
  }
}
