/*
  Warnings:

  - Added the required column `criadorId` to the `RelatorioVia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RelatorioVia" ADD COLUMN     "criadorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RelatorioVia" ADD CONSTRAINT "RelatorioVia_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
