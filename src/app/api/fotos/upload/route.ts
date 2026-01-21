// src/app/api/fotos/upload/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// ✅ Importe os tipos de resposta da API do Cloudinary
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Configurar o Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper para fazer upload de um buffer para o Cloudinary
// ✅ Corrigido: Retorna 'Promise<UploadApiResponse>' em vez de 'Promise<any>'
async function uploadToCloudinary(fileBuffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sgp-campo",
        resource_type: "image"
      },
      // ✅ Corrigido: Adiciona os tipos de erro e resultado
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        // ✅ Corrigido: Garante que o resultado não seja indefinido
        if (!result) {
            return reject(new Error("O upload para o Cloudinary não retornou um resultado."));
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function POST(req: Request) {
  try {
    // 1. Autenticação (sem mudanças)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    const decoded = jwt.verify(token, secret) as { id: string };
    const userId = decoded.id;

    // 2. Processar o formulário (sem mudanças)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const payloadField = formData.get('payload') as string | null;

    if (!file || !payloadField) {
      return NextResponse.json({ error: 'Arquivo ou payload ausentes.' }, { status: 400 });
    }

    // 3. Converter para Buffer (sem mudanças)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 4. Fazer o upload (sem mudanças)
    console.log(`[Backend] Enviando ${file.name} para o Cloudinary...`);
    const uploadResult = await uploadToCloudinary(fileBuffer);
    const imageUrl = uploadResult.secure_url;
    console.log(`[Backend] Upload concluído. URL: ${imageUrl}`);

    // 5. Salvar no banco de dados (sem mudanças)
    const photoData = JSON.parse(payloadField);
    const dataToSave = {
      id: photoData.id, 
      imageUrl: imageUrl,
      latitude: photoData.latitude,
      longitude: photoData.longitude,
      dataCaptura: new Date(photoData.dataCaptura),
      descricao: photoData.descricao,
      extensaoM: photoData.extensaoM,
      larguraM: photoData.larguraM,
      tipo: photoData.tipo,
      userId: userId,
      vistoriaId: photoData.vistoriaId,
      trechoId: photoData.trechoId,
      patologiaId: photoData.patologiaId,
      rdsOcorrenciaId: photoData.rdsOcorrenciaId,
      estaca: photoData.estaca,
    };

    const newPhotoRecord = await prisma.foto.upsert({
      where: { id: photoData.id },
      update: dataToSave,
      create: dataToSave,
    });

    return NextResponse.json(newPhotoRecord, { status: 200 });

  } catch (error) {
    console.error('Erro no upload da foto:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}