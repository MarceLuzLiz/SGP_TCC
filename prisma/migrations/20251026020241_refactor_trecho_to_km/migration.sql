/*
  Warnings:

  - You are about to drop the column `estacaFinal` on the `Trecho` table. All the data in the column will be lost.
  - You are about to drop the column `estacaInicial` on the `Trecho` table. All the data in the column will be lost.
  - Added the required column `kmFinal` to the `Trecho` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kmInicial` to the `Trecho` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trecho" DROP COLUMN "estacaFinal",
DROP COLUMN "estacaInicial",
ADD COLUMN     "kmFinal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "kmInicial" DOUBLE PRECISION NOT NULL;
