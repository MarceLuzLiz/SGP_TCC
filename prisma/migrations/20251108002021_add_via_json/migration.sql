/*
  Warnings:

  - Added the required column `trajetoJson` to the `Via` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Via" ADD COLUMN     "trajetoJson" JSONB NOT NULL;
