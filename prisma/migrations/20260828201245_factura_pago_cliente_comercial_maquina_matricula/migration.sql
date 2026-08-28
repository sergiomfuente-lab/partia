-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "nombreComercial" TEXT;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "fechaPago" TIMESTAMP(3),
ADD COLUMN     "pagadoPorId" TEXT;

-- AlterTable
ALTER TABLE "Maquina" ADD COLUMN     "matricula" TEXT;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_pagadoPorId_fkey" FOREIGN KEY ("pagadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
