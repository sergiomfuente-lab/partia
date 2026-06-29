-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "direccionReparacion" TEXT,
ADD COLUMN     "trabajosRealizados" TEXT;

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ordenId" TEXT NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
