-- AlterTable
ALTER TABLE "Abono" ADD COLUMN     "fechaHoraHuella" TIMESTAMP(3),
ADD COLUMN     "huella" TEXT,
ADD COLUMN     "huellaAnterior" TEXT,
ADD COLUMN     "tipoRectificacion" TEXT DEFAULT 'R1';

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "facturacionInmutableActiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regimenFiscalVerifactu" TEXT,
ADD COLUMN     "ultimaHuellaFactura" TEXT,
ADD COLUMN     "verifactuFechaLimite" TIMESTAMP(3),
ADD COLUMN     "verifactuModalidad" TEXT,
ADD COLUMN     "verifactuNotasGestoria" TEXT;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "fechaHoraHuella" TIMESTAMP(3),
ADD COLUMN     "huella" TEXT,
ADD COLUMN     "huellaAnterior" TEXT;
