// create-test-user.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'fiscal@sgp.com';
  const name = 'Fiscal de Teste';
  const plainPassword = 'password123'; // Senha que vamos usar para logar

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
      role: Role.FISCAL, // Usando o Enum do nosso schema
    },
  });

  console.log(`Usuário de teste criado com sucesso: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });