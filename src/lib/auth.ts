import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, 
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'seuemail@exemplo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        if (user.isSuspended) {
          console.log(`Tentativa de login bloqueada: Usuário ${user.email} está suspenso.`);
          return null; // Nega a autorização
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        
        token.id = user.id;
        // @ts-expect-error Corrigido
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // @ts-expect-error Corrigido
        session.user.id = token.id;
        // @ts-expect-error Corrigido
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};