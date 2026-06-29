-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "tipoDescuento" TEXT NOT NULL DEFAULT 'euro';

-- CreateTable
CREATE TABLE "ContadorFactura" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContadorFactura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContadorFactura_usuarioId_anio_key" ON "ContadorFactura"("usuarioId", "anio");

-- AddForeignKey
ALTER TABLE "ContadorFactura" ADD CONSTRAINT "ContadorFactura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
