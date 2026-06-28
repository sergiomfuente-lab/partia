/*
  Warnings:

  - You are about to drop the column `nif` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `horas` on the `Maquina` table. All the data in the column will be lost.
  - You are about to drop the column `km` on the `Maquina` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Maquina` table. All the data in the column will be lost.
  - You are about to drop the column `serie` on the `Maquina` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Maquina` table. All the data in the column will be lost.
  - You are about to drop the `Parte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pieza` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cif]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cif` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marca` to the `Maquina` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numeroDeSerie` to the `Maquina` table without a default value. This is not possible if the table is not empty.
  - Made the column `modelo` on table `Maquina` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Parte" DROP CONSTRAINT "Parte_facturaId_fkey";

-- DropForeignKey
ALTER TABLE "Parte" DROP CONSTRAINT "Parte_maquinaId_fkey";

-- DropForeignKey
ALTER TABLE "Pieza" DROP CONSTRAINT "Pieza_parteId_fkey";

-- DropIndex
DROP INDEX "Cliente_nif_key";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "nif",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cif" TEXT NOT NULL,
ADD COLUMN     "direccionFacturacion" TEXT,
ADD COLUMN     "formaPago" TEXT DEFAULT 'Transferencia bancaria',
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "precioHoraEspecial" DOUBLE PRECISION,
ADD COLUMN     "razonSocial" TEXT,
ALTER COLUMN "tipo" SET DEFAULT 'empresa';

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "baseImponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL DEFAULT 21,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Maquina" DROP COLUMN "horas",
DROP COLUMN "km",
DROP COLUMN "nombre",
DROP COLUMN "serie",
DROP COLUMN "year",
ADD COLUMN     "horasActuales" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "horasIniciales" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "marca" TEXT NOT NULL,
ADD COLUMN     "numeroDeSerie" TEXT NOT NULL,
ADD COLUMN     "observaciones" TEXT,
ALTER COLUMN "modelo" SET NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'activo';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "precioHora" DOUBLE PRECISION NOT NULL DEFAULT 55,
ADD COLUMN     "precioPorKm" DOUBLE PRECISION NOT NULL DEFAULT 0.35;

-- DropTable
DROP TABLE "Parte";

-- DropTable
DROP TABLE "Pieza";

-- CreateTable
CREATE TABLE "Orden" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kmDesplazamiento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasTrabajadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioHora" DOUBLE PRECISION NOT NULL DEFAULT 55,
    "precioPorKm" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "clienteId" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "facturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repuesto" (
    "id" TEXT NOT NULL,
    "referencia" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioCoste" DOUBLE PRECISION NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "ordenId" TEXT NOT NULL,

    CONSTRAINT "Repuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Orden_numero_key" ON "Orden"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cif_key" ON "Cliente"("cif");

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repuesto" ADD CONSTRAINT "Repuesto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
