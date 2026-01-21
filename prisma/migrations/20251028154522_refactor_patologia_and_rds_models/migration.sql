/*
  Warnings:

  - You are about to drop the column `classificacaoEspecifica` on the `Patologia` table. All the data in the column will be lost.
  - You are about to drop the column `fatorPonderacao` on the `Patologia` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Foto" DROP CONSTRAINT "Foto_patologiaId_fkey";

-- AlterTable
ALTER TABLE "Foto" ADD COLUMN     "rdsOcorrenciaId" TEXT,
ALTER COLUMN "patologiaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Patologia" DROP COLUMN "classificacaoEspecifica",
DROP COLUMN "fatorPonderacao";

-- CreateTable
CREATE TABLE "RdsOcorrencia" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ocorrencia" TEXT NOT NULL,

    CONSTRAINT "RdsOcorrencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_patologiaId_fkey" FOREIGN KEY ("patologiaId") REFERENCES "Patologia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_rdsOcorrenciaId_fkey" FOREIGN KEY ("rdsOcorrenciaId") REFERENCES "RdsOcorrencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
