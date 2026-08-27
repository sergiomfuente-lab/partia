/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,numero]` on the table `Factura` will be added. If there are existing duplicate values, this will fail.
  - Made the column `empresaId` on table `Factura` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_empresaId_fkey";

-- DropIndex
DROP INDEX "Factura_numero_key";

-- AlterTable
ALTER TABLE "Factura" ALTER COLUMN "empresaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Factura_empresaId_numero_key" ON "Factura"("empresaId", "numero");

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
