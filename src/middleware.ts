import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 1. Usuário é ADMIN
    if (token?.role === 'ADMIN') {
      if (pathname.startsWith('/dashboard-admin')) {
        return NextResponse.next(); // 1a. Está na página certa. Permite.
      }
      // 1b. Está em qualquer outra página (Fiscal/Eng). Redireciona para o Admin.
      return NextResponse.redirect(new URL('/dashboard-admin/cancelamentos', req.url));
    }

    // 2. Usuário é ENGENHEIRO
    if (token?.role === 'ENGENHEIRO') {
      if (pathname.startsWith('/dashboard-engenheiro')) {
        return NextResponse.next(); // 2a. Está na página certa. Permite.
      }
      // 2b. Está em qualquer outra página (Fiscal/Admin). Redireciona para o Engenheiro.
      return NextResponse.redirect(new URL('/dashboard-engenheiro', req.url));
    }

    // 3. Usuário é FISCAL
    if (token?.role === 'FISCAL') {
      // 3a. Está na página certa (e não é a do engenheiro/admin). Permite.
      if (pathname.startsWith('/dashboard') && 
          !pathname.startsWith('/dashboard-engenheiro') && 
          !pathname.startsWith('/dashboard-admin')) {
        return NextResponse.next();
      }
      // 3b. Está em qualquer outra página (Engenheiro/Admin). Redireciona para o Fiscal.
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 4. Failsafe (se tiver token mas nenhum cargo, deixa passar - ou redireciona para login)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

// O 'matcher' corrigido para incluir as páginas raiz (ex: /dashboard)
export const config = {
  matcher: [
    '/dashboard(.*)',
    '/dashboard-engenheiro(.*)',
    '/dashboard-admin(.*)',
  ],
};