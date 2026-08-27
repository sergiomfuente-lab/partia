-- AlterTable
ALTER TABLE "Orden" ADD COLUMN     "horasTrabajo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SesionTrabajo" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SesionTrabajo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SesionTrabajo" ADD CONSTRAINT "SesionTrabajo_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
