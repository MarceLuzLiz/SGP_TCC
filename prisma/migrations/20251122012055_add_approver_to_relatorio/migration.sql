-- AlterTable
ALTER TABLE "Relatorio" ADD COLUMN     "approverId" TEXT;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
