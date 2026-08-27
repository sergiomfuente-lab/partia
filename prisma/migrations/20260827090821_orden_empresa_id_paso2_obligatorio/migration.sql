/*
  Warnings:

  - Made the column `empresaId` on table `Orden` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Orden" DROP CONSTRAINT "Orden_empresaId_fkey";

-- AlterTable
ALTER TABLE "Orden" ALTER COLUMN "empresaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
