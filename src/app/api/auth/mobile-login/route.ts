// src/app/api/auth/mobile-login/route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validação básica
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    // 2. Encontra o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    // 3. Compara a senha enviada com a senha no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    // 4. Se tudo estiver correto, crie o token JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('A chave secreta JWT não está configurada no .env');
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '4h' }); // Token expira em 4 horas

    // 5. Retorna uma resposta 200 OK com os dados e o token
    // Removendo a senha do objeto de usuário antes de enviar
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        token: token,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na rota de login móvel:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}