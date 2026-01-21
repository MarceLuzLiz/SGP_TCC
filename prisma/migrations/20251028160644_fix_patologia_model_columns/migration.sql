/*
  Warnings:

  - You are about to drop the column `categoria` on the `Patologia` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoria` on the `Patologia` table. All the data in the column will be lost.
  - Added the required column `classificacaoEspecifica` to the `Patologia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatorPonderacao` to the `Patologia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Patologia" DROP COLUMN "categoria",
DROP COLUMN "subcategoria",
ADD COLUMN     "classificacaoEspecifica" TEXT NOT NULL,
ADD COLUMN     "fatorPonderacao" DOUBLE PRECISION NOT NULL;
