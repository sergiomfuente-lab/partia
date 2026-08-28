-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "fotoTicketBase64" TEXT,
ADD COLUMN     "tecnicoId" TEXT;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
