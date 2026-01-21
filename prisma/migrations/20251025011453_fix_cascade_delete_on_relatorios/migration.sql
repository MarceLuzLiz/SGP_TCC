-- DropForeignKey
ALTER TABLE "public"."RelatorioFoto" DROP CONSTRAINT "RelatorioFoto_relatorioId_fkey";

-- AddForeignKey
ALTER TABLE "RelatorioFoto" ADD CONSTRAINT "RelatorioFoto_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "Relatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
