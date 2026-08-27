-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "empresaId" TEXT;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
