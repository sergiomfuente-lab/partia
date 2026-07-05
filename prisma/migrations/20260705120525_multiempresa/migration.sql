/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `ContadorFactura` table. All the data in the column will be lost.
  - You are about to drop the column `cifNif` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `ciudad` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `codigoPostal` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `direccionFiscal` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `emailFacturacion` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `nombreFiscal` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `precioHora` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `precioPorKm` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `provincia` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `ConfiguracionEmpresa` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[empresaId,anio]` on the table `ContadorFactura` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `empresaId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `ContadorFactura` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "ContadorFactura" DROP CONSTRAINT "ContadorFactura_usuarioId_fkey";

-- DropIndex
DROP INDEX "Cliente_cif_key";

-- DropIndex
DROP INDEX "ContadorFactura_usuarioId_anio_key";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "empresaId" TEXT NOT NULL,
ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ContadorFactura" DROP COLUMN "usuarioId",
ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "cifNif",
DROP COLUMN "ciudad",
DROP COLUMN "codigoPostal",
DROP COLUMN "direccionFiscal",
DROP COLUMN "emailFacturacion",
DROP COLUMN "iban",
DROP COLUMN "nombreFiscal",
DROP COLUMN "precioHora",
DROP COLUMN "precioPorKm",
DROP COLUMN "provincia",
DROP COLUMN "telefono",
ADD COLUMN     "empresaId" TEXT;

-- DropTable
DROP TABLE "ConfiguracionEmpresa";

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreFiscal" TEXT,
    "cifNif" TEXT,
    "direccionFiscal" TEXT,
    "codigoPostal" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "telefono" TEXT,
    "emailFacturacion" TEXT,
    "iban" TEXT,
    "logoBase64" TEXT,
    "textoRgpd" TEXT,
    "precioHora" DOUBLE PRECISION NOT NULL DEFAULT 55,
    "precioPorKm" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContadorFactura_empresaId_anio_key" ON "ContadorFactura"("empresaId", "anio");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContadorFactura" ADD CONSTRAINT "ContadorFactura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
