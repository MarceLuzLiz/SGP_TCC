// create-test-engenheiro.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Dados do Engenheiro ---
  const email = 'engenheiro@sgp.com';
  const name = 'Engenheiro de Teste';
  const plainPassword = 'password123'; // Pode usar a mesma senha para facilitar
  // -------------------------

  // Criptografa a senha
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Deleta o usuário se ele já existir para evitar erros
  await prisma.user.delete({ where: { email } }).catch(() => {
    // Ignora o erro se o usuário não existir
  });

  // Cria o novo usuário
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: Role.ENGENHEIRO, // <-- A MUDANÇA PRINCIPAL ESTÁ AQUI
    },
  });

  console.log(`Usuário Engenheiro criado com sucesso: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });