-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "tecnicoId" TEXT;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
