/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,numero]` on the table `Abono` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,numero]` on the table `Presupuesto` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Abono_numero_key";

-- DropIndex
DROP INDEX "Presupuesto_numero_key";

-- CreateIndex
CREATE UNIQUE INDEX "Abono_empresaId_numero_key" ON "Abono"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_empresaId_numero_key" ON "Presupuesto"("empresaId", "numero");
