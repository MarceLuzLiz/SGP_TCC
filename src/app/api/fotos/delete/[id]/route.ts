// src/app/api/fotos/delete/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, StatusAprovacao } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Configura o Cloudinary (necessário para a exclusão)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const photoId = resolvedParams.id;

  try {
    // 1. Autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    jwt.verify(token, secret);

    // 2. Trava de Segurança (essencial!)
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
        { error: 'Esta foto faz parte de um relatório aprovado e não pode ser excluída.' },
        { status: 403 } // Proibido
      );
    }
    
    // 3. Encontra a foto no banco de dados para obter a URL
    const foto = await prisma.foto.findUnique({
      where: { id: photoId },
      select: { imageUrl: true }
    });

    if (!foto) {
      console.warn(`[DELETE] Foto ${photoId} não encontrada no DB. Pulando.`);
      return NextResponse.json({ message: 'Foto já removida.' }, { status: 200 });
    }

    // 4. Excluir a foto do Cloudinary
    const publicId = foto.imageUrl.split('/').slice(-2).join('/').split('.')[0];
    if (publicId && publicId.startsWith('sgp-campo')) { // Segurança extra
        console.log(`[Backend] Excluindo ${publicId} do Cloudinary...`);
        await cloudinary.uploader.destroy(publicId);
    } else {
        console.warn(`[Backend] Não foi possível extrair o public_id do Cloudinary da URL: ${foto.imageUrl}`);
    }

    // 5. Excluir a foto do banco de dados
    await prisma.relatorioFoto.deleteMany({
      where: { fotoId: photoId }
    });
    await prisma.foto.delete({
      where: { id: photoId }
    });

    return NextResponse.json({ message: 'Foto excluída com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error(`Erro ao excluir foto ${photoId}:`, error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}