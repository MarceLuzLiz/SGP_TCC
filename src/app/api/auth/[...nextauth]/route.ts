import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Importe do novo local

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };