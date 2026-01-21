/*
  Warnings:

  - You are about to drop the column `tipoPatologia` on the `Foto` table. All the data in the column will be lost.
  - Added the required column `patologiaId` to the `Foto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Foto" DROP COLUMN "tipoPatologia",
ADD COLUMN     "patologiaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Patologia" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT NOT NULL,
    "classificacaoEspecifica" TEXT,
    "codigoDnit" TEXT NOT NULL,
    "mapeamentoIgg" TEXT NOT NULL,
    "fatorPonderacao" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Patologia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patologia_codigoDnit_key" ON "Patologia"("codigoDnit");

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_patologiaId_fkey" FOREIGN KEY ("patologiaId") REFERENCES "Patologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
