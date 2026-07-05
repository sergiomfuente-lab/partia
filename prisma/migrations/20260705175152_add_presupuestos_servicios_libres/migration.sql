-- DropForeignKey
ALTER TABLE "Repuesto" DROP CONSTRAINT "Repuesto_ordenId_fkey";

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "presupuestoId" TEXT;

-- AlterTable
ALTER TABLE "Repuesto" ADD COLUMN     "presupuestoId" TEXT,
ALTER COLUMN "ordenId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ContadorPresupuesto" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContadorPresupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioLibre" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ordenId" TEXT,
    "presupuestoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicioLibre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validezHasta" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "direccionReparacion" TEXT,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "baseImponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipoDescuento" TEXT NOT NULL DEFAULT 'euro',
    "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "clienteId" TEXT NOT NULL,
    "maquinaId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContadorPresupuesto_empresaId_anio_key" ON "ContadorPresupuesto"("empresaId", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_numero_key" ON "Presupuesto"("numero");

-- AddForeignKey
ALTER TABLE "ContadorPresupuesto" ADD CONSTRAINT "ContadorPresupuesto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioLibre" ADD CONSTRAINT "ServicioLibre_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioLibre" ADD CONSTRAINT "ServicioLibre_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repuesto" ADD CONSTRAINT "Repuesto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repuesto" ADD CONSTRAINT "Repuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
