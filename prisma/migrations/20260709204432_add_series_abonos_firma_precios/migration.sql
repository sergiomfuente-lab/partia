-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "mostrarPrecios" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "esDirecta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serieId" TEXT;

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "firmaBase64" TEXT,
ADD COLUMN     "firmaDni" TEXT,
ADD COLUMN     "firmaObservaciones" TEXT,
ADD COLUMN     "mostrarPrecios" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SerieFacturacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL,
    "contadorActual" INTEGER NOT NULL DEFAULT 0,
    "prefijoAbono" TEXT NOT NULL,
    "contadorAbono" INTEGER NOT NULL DEFAULT 0,
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SerieFacturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaLinea" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'libre',
    "tipoServicioId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precioCoste" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioVenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facturaId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'total',
    "baseImponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motivo" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonoLinea" (
    "id" TEXT NOT NULL,
    "abonoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AbonoLinea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Abono_numero_key" ON "Abono"("numero");

-- AddForeignKey
ALTER TABLE "SerieFacturacion" ADD CONSTRAINT "SerieFacturacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "SerieFacturacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaLinea" ADD CONSTRAINT "FacturaLinea_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaLinea" ADD CONSTRAINT "FacturaLinea_tipoServicioId_fkey" FOREIGN KEY ("tipoServicioId") REFERENCES "TipoServicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "SerieFacturacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonoLinea" ADD CONSTRAINT "AbonoLinea_abonoId_fkey" FOREIGN KEY ("abonoId") REFERENCES "Abono"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
