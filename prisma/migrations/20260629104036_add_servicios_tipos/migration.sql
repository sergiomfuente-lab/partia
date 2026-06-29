/*
  Warnings:

  - You are about to drop the column `horasTrabajadas` on the `Orden` table. All the data in the column will be lost.
  - You are about to drop the column `kmDesplazamiento` on the `Orden` table. All the data in the column will be lost.
  - You are about to drop the column `precioHora` on the `Orden` table. All the data in the column will be lost.
  - You are about to drop the column `precioPorKm` on the `Orden` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Servicio` table. All the data in the column will be lost.
  - Added the required column `tipoServicioId` to the `Servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "precioPorKmEspecial" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Orden" DROP COLUMN "horasTrabajadas",
DROP COLUMN "kmDesplazamiento",
DROP COLUMN "precioHora",
DROP COLUMN "precioPorKm";

-- AlterTable
ALTER TABLE "Servicio" DROP COLUMN "tipo",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tipoServicioId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TipoServicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'ud',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoServicio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_tipoServicioId_fkey" FOREIGN KEY ("tipoServicioId") REFERENCES "TipoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
