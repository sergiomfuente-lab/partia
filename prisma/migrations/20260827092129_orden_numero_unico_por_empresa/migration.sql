/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,numero]` on the table `Orden` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Orden_numero_key";

-- CreateIndex
CREATE UNIQUE INDEX "Orden_empresaId_numero_key" ON "Orden"("empresaId", "numero");
