// src/app/api/fotos/update/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, StatusAprovacao } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  
  // ✅ MUDANÇA 1: Obtenha o ID da foto *fora* do bloco try
  // Isso torna 'photoId' visível para o bloco 'catch'
  const params = await context.params;
  const photoId = params.id;

  try {
    // ✅ MUDANÇA 2: O bloco 'try' agora começa *depois* de obter o ID

    // 1. Autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    jwt.verify(token, secret);

    // 2. Trava de Segurança (Verifica relatórios APROVADOS)
    const relatoriosVinculados = await prisma.relatorioFoto.findMany({
      where: {
        fotoId: photoId,
        relatorio: {
          statusAprovacao: StatusAprovacao.APROVADO,
        },
      },
    });

    if (relatoriosVinculados.length > 0) {
      return NextResponse.json(
        { error: 'Esta foto faz parte de um relatório aprovado e não pode ser modificada.' },
        { status: 403 } // Proibido
      );
    }
    
    // 3. Recebe os novos dados do corpo
    const body = await req.json();
    const { descricao, patologiaId, rdsOcorrenciaId, extensaoM, larguraM, estaca } = body;

    // 4. Atualiza a foto no banco de dados
    const updatedPhoto = await prisma.foto.update({
      where: { id: photoId },
      data: {
        descricao: descricao,
        patologiaId: patologiaId,
        rdsOcorrenciaId: rdsOcorrenciaId,
        extensaoM: extensaoM,
        larguraM: larguraM,
        estaca: estaca,
      },
    });

    return NextResponse.json(updatedPhoto, { status: 200 });

  } catch (error) {
    // ✅ Agora 'photoId' está visível aqui
    console.error(`Erro ao atualizar foto ${photoId}:`, error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}