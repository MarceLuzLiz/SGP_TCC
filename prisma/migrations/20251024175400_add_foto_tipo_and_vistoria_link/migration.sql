/*
  Warnings:

  - Added the required column `tipo` to the `Foto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vistoriaId` to the `Foto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FotoTipo" AS ENUM ('RFT', 'RDS');

-- AlterTable
ALTER TABLE "Foto" ADD COLUMN     "tipo" "FotoTipo" NOT NULL,
ADD COLUMN     "vistoriaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "Vistoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
