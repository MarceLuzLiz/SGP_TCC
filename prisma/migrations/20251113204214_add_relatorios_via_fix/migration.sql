-- CreateEnum
CREATE TYPE "TipoRelatorioVia" AS ENUM ('RFT_VIA', 'RDS_VIA', 'GERENCIAL_VIA');

-- CreateTable
CREATE TABLE "RelatorioVia" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRelatorioVia" NOT NULL,
    "titulo" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "dadosJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viaId" TEXT NOT NULL,

    CONSTRAINT "RelatorioVia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatorioViaItem" (
    "id" TEXT NOT NULL,
    "relatorioViaId" TEXT NOT NULL,
    "relatorioOrigemId" TEXT NOT NULL,

    CONSTRAINT "RelatorioViaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RelatorioViaItem_relatorioViaId_relatorioOrigemId_key" ON "RelatorioViaItem"("relatorioViaId", "relatorioOrigemId");

-- AddForeignKey
ALTER TABLE "RelatorioVia" ADD CONSTRAINT "RelatorioVia_viaId_fkey" FOREIGN KEY ("viaId") REFERENCES "Via"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioViaItem" ADD CONSTRAINT "RelatorioViaItem_relatorioViaId_fkey" FOREIGN KEY ("relatorioViaId") REFERENCES "RelatorioVia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioViaItem" ADD CONSTRAINT "RelatorioViaItem_relatorioOrigemId_fkey" FOREIGN KEY ("relatorioOrigemId") REFERENCES "Relatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
