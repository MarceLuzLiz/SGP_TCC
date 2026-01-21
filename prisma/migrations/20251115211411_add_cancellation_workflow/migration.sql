-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterEnum
ALTER TYPE "StatusAprovacao" ADD VALUE 'CANCELAMENTO_PENDENTE';

-- AlterTable
ALTER TABLE "Relatorio" ADD COLUMN     "motivoCancelamento" TEXT;
