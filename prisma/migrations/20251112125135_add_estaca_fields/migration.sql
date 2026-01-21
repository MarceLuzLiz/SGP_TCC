-- AlterTable
ALTER TABLE "Foto" ADD COLUMN     "estaca" TEXT;

-- AlterTable
ALTER TABLE "Trecho" ADD COLUMN     "estacas" TEXT;

-- AlterTable
ALTER TABLE "Via" ADD COLUMN     "estacas" TEXT,
ALTER COLUMN "trajetoJson" DROP NOT NULL;
