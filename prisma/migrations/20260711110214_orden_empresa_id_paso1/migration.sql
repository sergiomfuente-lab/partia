-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "cif" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Repuesto" ALTER COLUMN "cantidad" SET DEFAULT 1,
ALTER COLUMN "cantidad" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ContadorOrden" (
    "id" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContadorOrden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContadorOrden_empresaId_key" ON "ContadorOrden"("empresaId");

-- AddForeignKey
ALTER TABLE "ContadorOrden" ADD CONSTRAINT "ContadorOrden_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
