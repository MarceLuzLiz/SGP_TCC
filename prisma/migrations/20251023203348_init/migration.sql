-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FISCAL', 'ENGENHEIRO');

-- CreateEnum
CREATE TYPE "RelatorioTipo" AS ENUM ('RFT', 'RDS');

-- CreateEnum
CREATE TYPE "StatusAprovacao" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FISCAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Via" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "extensaoKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Via_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserViaAssignment" (
    "userId" TEXT NOT NULL,
    "viaId" TEXT NOT NULL,

    CONSTRAINT "UserViaAssignment_pkey" PRIMARY KEY ("userId","viaId")
);

-- CreateTable
CREATE TABLE "Trecho" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "estacaInicial" TEXT NOT NULL,
    "estacaFinal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viaId" TEXT NOT NULL,

    CONSTRAINT "Trecho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vistoria" (
    "id" TEXT NOT NULL,
    "dataVistoria" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trechoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Vistoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "dataCaptura" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "tipoPatologia" TEXT,
    "grauSeveridade" TEXT,
    "extensaoM" DOUBLE PRECISION,
    "larguraM" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trechoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousFotoId" TEXT,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relatorio" (
    "id" TEXT NOT NULL,
    "tipo" "RelatorioTipo" NOT NULL,
    "statusAprovacao" "StatusAprovacao" NOT NULL DEFAULT 'PENDENTE',
    "dadosJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trechoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vistoriaId" TEXT NOT NULL,

    CONSTRAINT "Relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatorioFoto" (
    "relatorioId" TEXT NOT NULL,
    "fotoId" TEXT NOT NULL,

    CONSTRAINT "RelatorioFoto_pkey" PRIMARY KEY ("relatorioId","fotoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Foto_previousFotoId_key" ON "Foto"("previousFotoId");

-- AddForeignKey
ALTER TABLE "UserViaAssignment" ADD CONSTRAINT "UserViaAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserViaAssignment" ADD CONSTRAINT "UserViaAssignment_viaId_fkey" FOREIGN KEY ("viaId") REFERENCES "Via"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trecho" ADD CONSTRAINT "Trecho_viaId_fkey" FOREIGN KEY ("viaId") REFERENCES "Via"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_trechoId_fkey" FOREIGN KEY ("trechoId") REFERENCES "Trecho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_trechoId_fkey" FOREIGN KEY ("trechoId") REFERENCES "Trecho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_previousFotoId_fkey" FOREIGN KEY ("previousFotoId") REFERENCES "Foto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_trechoId_fkey" FOREIGN KEY ("trechoId") REFERENCES "Trecho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_vistoriaId_fkey" FOREIGN KEY ("vistoriaId") REFERENCES "Vistoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioFoto" ADD CONSTRAINT "RelatorioFoto_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "Relatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioFoto" ADD CONSTRAINT "RelatorioFoto_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Foto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
